import { sessions, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

export interface ISessionRepository {
  create(data: Prisma.sessionsCreateInput): Promise<sessions>
  findByHashAndId(id: string, tokenHash: string): Promise<sessions | null>
  deleteById(id: string): Promise<void>
  deleteManyByUser(userId: number): Promise<number>
  deleteManyByUserExcept(userId: number, keepSessionId: string): Promise<number>
}

export class SessionRepository implements ISessionRepository {
  async create(data: Prisma.sessionsCreateInput): Promise<sessions> {
    return prisma.sessions.create({ data })
  }

  async findByHashAndId(
    id: string,
    tokenHash: string
  ): Promise<sessions | null> {
    return prisma.sessions.findFirst({ where: { id, token_hash: tokenHash } })
  }

  async deleteById(id: string): Promise<void> {
    await prisma.sessions.delete({ where: { id } }).catch(() => null)
  }

  async deleteManyByUser(userId: number): Promise<number> {
    const result = await prisma.sessions.deleteMany({
      where: { user_id: userId },
    })
    return result.count
  }

  async deleteManyByUserExcept(
    userId: number,
    keepSessionId: string
  ): Promise<number> {
    const result = await prisma.sessions.deleteMany({
      where: { user_id: userId, NOT: { id: keepSessionId } },
    })
    return result.count
  }
}

export const sessionRepository = new SessionRepository()
