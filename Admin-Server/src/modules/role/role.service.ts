import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between, IsNull, In } from "typeorm";
import { Role } from "./entities/role.entity";
import { UserRole } from "./entities/user-role.entity";
import { RoleMenu } from "./entities/role-menu.entity";
import { Menu } from "../menu/entities/menu.entity";
import { UserService } from "../user/user.service";
import type {
  RoleInfo,
  RoleListParams,
  CreateRoleParams,
  UpdateRoleParams,
} from "@shared/types/role";
import { ApiResponsePage } from "@shared/types";
import { formatList, buildUserMap } from "../../common/utils/format.util";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RoleMenu)
    private roleMenuRepository: Repository<RoleMenu>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    private userService: UserService,
  ) {}

  /**
   * 根据ID查找角色
   */
  async findById(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  /**
   * 根据角色编码查找（排除已软删除的）
   */
  async findByRoleCode(roleCode: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { roleCode, deleteTime: IsNull() } });
  }

  /**
   * 构建角色列表查询条件（复用 findRoleList / findAllForExport）
   */
  private buildRoleListWhere(params: Partial<RoleListParams>): any {
    const { roleName, roleCode, isActive, createTimeStart, createTimeEnd } = params;
    const where: any = { deleteTime: IsNull() };
    if (roleName) where.roleName = Like(`%${roleName}%`);
    if (roleCode) where.roleCode = Like(`%${roleCode}%`);
    if (isActive !== undefined) where.isActive = isActive;
    if (createTimeStart && createTimeEnd) {
      where.createTime = Between(new Date(createTimeStart), new Date(createTimeEnd));
    } else if (createTimeStart) {
      where.createTime = Between(new Date(createTimeStart), new Date('9999-12-31'));
    } else if (createTimeEnd) {
      where.createTime = Between(new Date('1970-01-01'), new Date(createTimeEnd));
    }
    return where;
  }

  /**
   * 格式化列表数据（填充创建人/修改人名称）
   */
  private async formatListData(list: any[]): Promise<any[]> {
    const rawList = list.map(({ ...rest }) => rest);
    const userMap = await buildUserMap(rawList, (id) => this.userService.getUserNameById(id));
    return formatList(rawList, userMap);
  }

  /**
   * 分页查询角色列表
   */
  async findRoleList(
    params: RoleListParams,
  ): Promise<ApiResponsePage<RoleInfo[]>> {
    const { page = 1, pageSize = 20 } = params;
    const where = this.buildRoleListWhere(params);

    const [list, total] = await this.roleRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { sort: "ASC", createTime: "DESC" },
    });

    const safeList = await this.formatListData(list);
    return { data: safeList as any, total, page, pageSize };
  }

  /**
   * 导出角色列表（支持分页筛选）
   */
  async findAllForExport(
    params: Partial<RoleListParams>,
  ): Promise<any[]> {
    const { page, pageSize } = params;
    const where = this.buildRoleListWhere(params);

    const query: any = { where, order: { sort: "ASC", createTime: "DESC" } };
    if (page && pageSize) {
      query.skip = (page - 1) * pageSize;
      query.take = pageSize;
    }
    const list = await this.roleRepository.find(query);

    return this.formatListData(list);
  }

  /**
   * 新增角色
   */
  async createRole(params: CreateRoleParams & { operatorId: number }): Promise<Partial<Role>> {
    const { roleName, roleCode, sort, isActive, remark, operatorId } = params;

    const existing = await this.findByRoleCode(roleCode);
    if (existing) {
      throw new ConflictException("角色编码已存在");
    }

    const roleInput: Partial<Role> = {
      roleName,
      roleCode,
      sort: sort ?? 0,
      isActive: isActive ?? true,
      remark: remark ?? undefined,
      createUser: operatorId,
    };
    const role = this.roleRepository.create(roleInput as Role);

    const saved = await this.roleRepository.save(role);
    const result: Partial<Role> = { ...saved };
    return result;
  }

  /**
   * 更新角色
   */
  async updateRole(params: UpdateRoleParams & { operatorId: number }): Promise<Partial<Role>> {
    const { id, roleName, roleCode, sort, isActive, remark, operatorId } = params;

    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException("角色不存在");
    }

    if (roleCode && roleCode !== role.roleCode) {
      const conflict = await this.findByRoleCode(roleCode);
      if (conflict && conflict.id !== id) {
        throw new ConflictException("角色编码已存在");
      }
      role.roleCode = roleCode;
    }

    if (roleName !== undefined) role.roleName = roleName;
    if (sort !== undefined) role.sort = sort;
    if (isActive !== undefined) role.isActive = isActive;
    if (remark !== undefined) role.remark = remark;
    role.lastModifier = operatorId;

    const saved = await this.roleRepository.save(role);
    const result: Partial<Role> = { ...saved };
    return result;
  }

  /**
   * 删除角色（软删除）
   */
  async deleteRole(id: number, operatorId: number): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException("角色不存在");
    }

    role.isActive = false;
    role.deleteUser = operatorId;
    role.deleteTime = new Date();
    await this.roleRepository.save(role);
  }

  // ============================================================
  // 用户-角色分配
  // ============================================================

  async getUserRoleIds(userId: number): Promise<number[]> {
    const rows = await this.userRoleRepository.find({ where: { userId } });
    return rows.map((r) => r.roleId);
  }

  async assignUserRoles(userId: number, roleIds: number[]): Promise<void> {
    await this.userRoleRepository.delete({ userId });
    if (roleIds.length > 0) {
      await this.userRoleRepository.save(
        roleIds.map((roleId) => ({ userId, roleId })),
      );
    }
  }

  // ============================================================
  // 角色-菜单权限分配
  // ============================================================

  /**
   * 获取角色已分配的菜单 ID 列表
   */
  async getRoleMenuIds(roleId: number): Promise<number[]> {
    const rows = await this.roleMenuRepository.find({ where: { roleId } });
    return rows.map((r) => r.menuId);
  }

  /**
   * 分配角色菜单权限
   * 自动补充选中节点的所有祖先节点，保证权限链完整
   */
  async assignRoleMenus(roleId: number, menuIds: number[]): Promise<void> {
    // 补充所有祖先节点
    let finalIds = [...menuIds];
    if (menuIds.length > 0) {
      const ancestorSet = new Set<number>();
      const allMenus = await this.menuRepository.find({
        where: { deleteTime: IsNull() as any },
        select: ['id', 'parentId'],
      });
      const parentMap = new Map<number, number>();
      for (const menu of allMenus) {
        parentMap.set(menu.id, menu.parentId);
      }

      for (const id of menuIds) {
        let parentId = parentMap.get(id);
        while (parentId && parentId !== 0) {
          ancestorSet.add(parentId);
          parentId = parentMap.get(parentId);
        }
      }

      finalIds = [...new Set([...menuIds, ...ancestorSet])];
    }

    await this.roleMenuRepository.delete({ roleId });
    if (finalIds.length > 0) {
      await this.roleMenuRepository.save(
        finalIds.map((menuId) => ({ roleId, menuId })),
      );
    }
  }

  // ============================================================
  // 查询用户权限（登录时调用）
  // ============================================================

  async getUserRoleCodes(userId: number): Promise<string[]> {
    const rows = await this.userRoleRepository.find({ where: { userId } });
    if (rows.length === 0) return [];
    const roleIds = rows.map((r) => r.roleId);
    const roles = await this.roleRepository.find({
      where: { id: In(roleIds), isActive: true, deleteTime: IsNull() },
    });
    return roles.map((r) => r.roleCode);
  }

  async getUserPerms(userId: number): Promise<string[]> {
    const result = await this.roleRepository.manager.query(
      `SELECT DISTINCT m.perms
       FROM sys_menus m
       INNER JOIN sys_role_menus rm ON m.id = rm.menuId
       INNER JOIN sys_user_roles ur ON rm.roleId = ur.roleId
       WHERE ur.userId = ?
         AND m.type = 3
         AND m.isActive = 1
         AND m.perms IS NOT NULL
         AND m.deleteTime IS NULL`,
      [userId],
    );
    return result.map((r: any) => r.perms);
  }

  async getUserMenus(userId: number): Promise<any[]> {
    const result = await this.roleRepository.manager.query(
      `SELECT DISTINCT m.id, m.parentId, m.title, m.type, m.path, m.component, m.icon, m.sort
       FROM sys_menus m
       INNER JOIN sys_role_menus rm ON m.id = rm.menuId
       INNER JOIN sys_user_roles ur ON rm.roleId = ur.roleId
       WHERE ur.userId = ?
         AND m.type IN (1, 2)
         AND m.isActive = 1
         AND m.deleteTime IS NULL
       ORDER BY m.sort ASC, m.id ASC`,
      [userId],
    );
    return result;
  }
}
