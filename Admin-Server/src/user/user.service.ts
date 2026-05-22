import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between } from "typeorm";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcrypt";
import type {
  UserInfo,
  UserListParams,
  CreateUserServiceParams,
  UpdateUserServiceParams,
  ChangePasswordParams,
} from "@shared/types/user";
import { ApiResponsePage } from "@shared/types";
import { formatList, buildUserMap } from "../common/utils/format.util";

@Injectable()
export class UserService {
  /** 用户 ID → 用户名 内存缓存，避免重复查询数据库 */
  private userNameCache = new Map<number, string>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 根据ID查找用户（优先走缓存）
   */
  async findByUserId(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * 根据用户ID获取用户名（带缓存）
   */
  async getUserNameById(userId: number): Promise<string> {
    // 查缓存
    if (this.userNameCache.has(userId)) {
      return this.userNameCache.get(userId)!;
    }
    // 查数据库
    try {
      const user = await this.findByUserId(userId);
      const name = user ? user.userName : "";
      if (name) this.userNameCache.set(userId, name);
      return name;
    } catch {
      return "";
    }
  }

  /** 清空用户名缓存（用户信息变更时调用） */
  clearUserNameCache() {
    this.userNameCache.clear();
  }

  /**
   * 根据用户名查找用户
   */
  async findByUserName(userName: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userName },
    });
  }

  /**
   * 验证密码
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 分页查询用户列表
   */
  async findUserList(
    params: UserListParams,
  ): Promise<ApiResponsePage<UserInfo[]>> {
    const { page = 1, pageSize = 20, userName, isActive, createTimeStart, createTimeEnd } = params;

    const where: any = {};
    if (userName) where.userName = Like(`%${userName}%`);
    if (isActive !== undefined) where.isActive = isActive;
    if (createTimeStart && createTimeEnd) {
      where.createTime = Between(new Date(createTimeStart), new Date(createTimeEnd));
    } else if (createTimeStart) {
      where.createTime = Between(new Date(createTimeStart), new Date('9999-12-31'));
    } else if (createTimeEnd) {
      where.createTime = Between(new Date('1970-01-01'), new Date(createTimeEnd));
    }

    const [list, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createTime: "DESC" },
    });

    // 过滤敏感字段，格式化日期，翻译用户 ID
    const rawList = list.map(({ passWord: _pw, ...rest }) => rest);
    const userMap = await buildUserMap(rawList, this);
    const safeList = formatList(rawList, userMap);

    return { data: safeList as any, total, page, pageSize };
  }

  /**
   * 导出用户列表（支持分页筛选）
   */
  async findAllForExport(
    params: Partial<UserListParams>,
  ): Promise<any[]> {
    const { page, pageSize, userName, isActive, createTimeStart, createTimeEnd } = params;

    const where: any = {};
    if (userName) where.userName = Like(`%${userName}%`);
    if (isActive !== undefined) where.isActive = isActive;
    if (createTimeStart && createTimeEnd) {
      where.createTime = Between(new Date(createTimeStart), new Date(createTimeEnd));
    } else if (createTimeStart) {
      where.createTime = Between(new Date(createTimeStart), new Date('9999-12-31'));
    } else if (createTimeEnd) {
      where.createTime = Between(new Date('1970-01-01'), new Date(createTimeEnd));
    }

    const query: any = { where, order: { createTime: "DESC" } };
    if (page && pageSize) {
      query.skip = (page - 1) * pageSize;
      query.take = pageSize;
    }
    const list = await this.userRepository.find(query);

    const rawList = list.map(({ passWord: _pw, ...rest }) => rest);
    const userMap = await buildUserMap(rawList, this);
    return formatList(rawList, userMap);
  }

  /**
   * 新增用户
   */
  async createUser(params: CreateUserServiceParams): Promise<Partial<User>> {
    const { userName, passWord, email, phone, isActive, operatorId } = params;

    // 检查用户名是否已存在
    const existing = await this.findByUserName(userName);
    if (existing) {
      throw new ConflictException("用户名已存在");
    }

    const hashedPassword = await bcrypt.hash(passWord, 10);

    const user = this.userRepository.create({
      userName,
      passWord: hashedPassword,
      email: email || null,
      phone: phone || null,
      isActive: isActive ?? true,
      createUser: operatorId,
    });

    const saved = await this.userRepository.save(user);
    const { passWord: _, ...result } = saved;
    this.clearUserNameCache();
    return result;
  }

  /**
   * 更新用户信息
   */
  async updateUser(params: UpdateUserServiceParams): Promise<Partial<User>> {
    const { id, userName, email, phone, isActive, operatorId } = params;

    const user = await this.findByUserId(id);
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 如果修改用户名，检查是否与其他用户冲突
    if (userName && userName !== user.userName) {
      const conflict = await this.findByUserName(userName);
      if (conflict) {
        throw new ConflictException("用户名已存在");
      }
      user.userName = userName;
    }

    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    user.lastModifier = operatorId;

    const saved = await this.userRepository.save(user);
    const { passWord: _, ...result } = saved;
    this.clearUserNameCache();
    return result;
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(id: number, operatorId: number): Promise<void> {
    const user = await this.findByUserId(id);
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    user.isActive = false;
    user.deleteUser = operatorId;
    user.deleteTime = new Date();
    await this.userRepository.save(user);
    this.clearUserNameCache();
  }

  /**
   * 修改当前用户密码
   */
  async changePassword(params: ChangePasswordParams): Promise<void> {
    const { userId, oldPassword, newPassword } = params;
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passWord);
    if (!isMatch) {
      throw new BadRequestException("原密码错误");
    }

    user.passWord = await bcrypt.hash(newPassword, 10);
    user.lastModifier = userId;
    await this.userRepository.save(user);
    this.clearUserNameCache();
  }
}
