import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 根据ID查找用户
   */
  async findByUserId(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
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
   * 根据用户ID获取用户名
   */
  async getUserNameById(userId: number): Promise<string> {
    try {
      const user = await this.findByUserId(userId);
      return user ? user.userName : "";
    } catch (error) {
      return "";
    }
  }

  /**
   * 分页查询用户列表
   */
  async findUserList(
    params: UserListParams,
  ): Promise<ApiResponsePage<UserInfo[]>> {
    const { page = 1, pageSize = 20, userName, isActive } = params;

    const where: any = {};
    if (userName) where.userName = Like(`%${userName}%`);
    if (isActive !== undefined) where.isActive = isActive;

    const [list, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createTime: "DESC" },
    });

    // 过滤掉敏感字段，并将 Date 类型转为 ISO 字符串以匹配 shared 类型
    const safeList = list.map(({ passWord: _pw, ...rest }) => ({
      ...rest,
      createTime:
        rest.createTime instanceof Date
          ? rest.createTime.toISOString()
          : rest.createTime,
      deleteTime:
        rest.deleteTime instanceof Date
          ? rest.deleteTime.toISOString()
          : rest.deleteTime,
      lastModified:
        rest.lastModified instanceof Date
          ? rest.lastModified.toISOString()
          : rest.lastModified,
    }));

    return { data: safeList, total, page, pageSize };
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
  }
}
