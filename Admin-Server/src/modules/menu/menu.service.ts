import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Menu } from "./entities/menu.entity";
import type { MenuInfo, CreateMenuParams, UpdateMenuParams } from "@shared/types/menu";
import { formatList, buildUserMap } from "../../common/utils/format.util";

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async findById(id: number): Promise<Menu | null> {
    return this.menuRepository.findOne({ where: { id } });
  }

  /**
   * 获取菜单树（扁平列表，由前端或本方法转为树）
   */
  async getMenuTree(isActive?: boolean, keyword?: string): Promise<MenuInfo[]> {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
      .where('menu.deleteTime IS NULL')
      .orderBy('menu.sort', 'ASC')
      .addOrderBy('menu.id', 'ASC');

    if (isActive !== undefined) {
      queryBuilder.andWhere('menu.isActive = :isActive', { isActive });
    }

    if (keyword) {
      queryBuilder.andWhere('menu.title LIKE :keyword', { keyword: `%${keyword}%` });
    }

    let list = await queryBuilder.getMany();

    // 搜索时补充匹配节点的祖先节点，保证树结构完整
    if (keyword) {
      const matchedIds = new Set(list.map(item => item.id));
      const allMenus = await this.menuRepository.find({
        where: { deleteTime: IsNull() as any },
        order: { sort: 'ASC', id: 'ASC' },
      });
      const idMap = new Map(allMenus.map(item => [item.id, item]));
      const ancestorIds = new Set<number>();

      for (const item of list) {
        let parentId = item.parentId;
        while (parentId !== 0 && idMap.has(parentId)) {
          ancestorIds.add(parentId);
          parentId = idMap.get(parentId)!.parentId;
        }
      }

      // 合并匹配节点 + 祖先节点
      const allIds = new Set([...matchedIds, ...ancestorIds]);
      list = allMenus.filter(item => allIds.has(item.id));
    }

    const rawList = list.map(item => ({ ...item })) as any[];
    const userMap = await buildUserMap(rawList, async (id) => {
      const user = await this.menuRepository.manager.query(
        `SELECT userName FROM sys_users WHERE id = ?`, [id]
      );
      return user[0]?.userName || '';
    });
    return formatList(rawList, userMap);
  }

  /**
   * 将扁平列表转为树形结构（同级别按 sort 升序排列）
   */
  static buildTree(list: MenuInfo[]): MenuInfo[] {
    const map = new Map<number, MenuInfo>();
    const tree: MenuInfo[] = [];

    // 先按 sort、id 排序，保证同级别顺序正确
    const sorted = [...list].sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return (a.id ?? 0) - (b.id ?? 0);
    });

    sorted.forEach((item) => {
      map.set(item.id!, { ...item, children: [] });
    });

    sorted.forEach((item) => {
      const node = map.get(item.id!)!;
      if (item.parentId === 0) {
        tree.push(node);
      } else {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    });

    return tree;
  }

  async createMenu(params: CreateMenuParams & { operatorId: number }): Promise<Partial<Menu>> {
    const { title, type, path, component, perms, icon, sort, isActive, remark, parentId, operatorId } = params;

    const menuInput: Partial<Menu> = {
      parentId: parentId ?? 0,
      title,
      type,
      path: path ?? undefined,
      component: component ?? undefined,
      perms: perms ?? undefined,
      icon: icon ?? undefined,
      sort: sort ?? 0,
      isActive: isActive ?? true,
      remark: remark ?? undefined,
      createUser: operatorId,
    };
    const menu = this.menuRepository.create(menuInput as Menu);

    const saved = await this.menuRepository.save(menu);
    const result: Partial<Menu> = { ...saved };
    return result;
  }

  async updateMenu(params: UpdateMenuParams & { operatorId: number }): Promise<Partial<Menu>> {
    const { id, title, type, path, component, perms, icon, sort, isActive, remark, parentId, operatorId } = params;

    const menu = await this.findById(id);
    if (!menu) throw new NotFoundException("菜单不存在");

    if (title !== undefined) menu.title = title;
    if (type !== undefined) menu.type = type;
    if (path !== undefined) menu.path = path;
    if (component !== undefined) menu.component = component;
    if (perms !== undefined) menu.perms = perms;
    if (icon !== undefined) menu.icon = icon;
    if (sort !== undefined) menu.sort = sort;
    if (isActive !== undefined) menu.isActive = isActive;
    if (remark !== undefined) menu.remark = remark;
    if (parentId !== undefined) menu.parentId = parentId;
    menu.lastModifier = operatorId;

    const saved = await this.menuRepository.save(menu);
    const result: Partial<Menu> = { ...saved };
    return result;
  }

  async deleteMenu(id: number, operatorId: number): Promise<void> {
    const menu = await this.findById(id);
    if (!menu) throw new NotFoundException("菜单不存在");

    // 如果有子节点，不允许删除
    const children = await this.menuRepository.find({ where: { parentId: id, deleteTime: IsNull() } });
    if (children.length > 0) {
      throw new ConflictException("请先删除子菜单或按钮");
    }

    menu.isActive = false;
    menu.deleteUser = operatorId;
    menu.deleteTime = new Date();
    await this.menuRepository.save(menu);
  }
}
