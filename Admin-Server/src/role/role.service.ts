import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between, IsNull } from "typeorm";
import { Role } from "./entities/role.entity";
import { UserService } from "../user/user.service";
import type {
  RoleInfo,
  RoleListParams,
  CreateRoleParams,
  UpdateRoleParams,
} from "@shared/types/role";
import { ApiResponsePage } from "@shared/types";
import { formatList, buildUserMap } from "../common/utils/format.util";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
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
   * 分页查询角色列表
   */
  async findRoleList(
    params: RoleListParams,
  ): Promise<ApiResponsePage<RoleInfo[]>> {
    const { page = 1, pageSize = 20, roleName, roleCode, isActive, createTimeStart, createTimeEnd } = params;

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

    const [list, total] = await this.roleRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { sort: "ASC", createTime: "DESC" },
    });

    const rawList = list.map(({ ...rest }) => rest);
    const userMap = await buildUserMap(rawList, (id) => this.userService.getUserNameById(id));
    const safeList = formatList(rawList, userMap);

    return { data: safeList as any, total, page, pageSize };
  }

  /**
   * 导出角色列表（支持分页筛选）
   */
  async findAllForExport(
    params: Partial<RoleListParams>,
  ): Promise<any[]> {
    const { page, pageSize, roleName, roleCode, isActive, createTimeStart, createTimeEnd } = params;

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

    const query: any = { where, order: { sort: "ASC", createTime: "DESC" } };
    if (page && pageSize) {
      query.skip = (page - 1) * pageSize;
      query.take = pageSize;
    }
    const list = await this.roleRepository.find(query);

    const rawList = list.map(({ ...rest }) => rest);
    const userMap = await buildUserMap(rawList, (id) => this.userService.getUserNameById(id));
    return formatList(rawList, userMap);
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

    const role = this.roleRepository.create({
      roleName,
      roleCode,
      sort: sort ?? 0,
      isActive: isActive ?? true,
      remark: remark || null,
      createUser: operatorId,
    });

    const saved = await this.roleRepository.save(role);
    const { ...result } = saved;
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
    const { ...result } = saved;
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
}
