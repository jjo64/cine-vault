import { describe, it, expect, vi, beforeEach } from "vitest"
import { crearEntradaDiarioService } from "../../services/diary.services.js"
import { diaryRepository } from "../../repositories/DiaryRepository.js"
import type { CrearEntradaDiarioDTO } from "../../schemas/diary.js"

vi.mock("../../repositories/DiaryRepository.js", () => ({
  diaryRepository: {
    findByUserMovieDate: vi.fn().mockResolvedValue(null),
    create: vi
      .fn()
      .mockImplementation((_userId: number, data: CrearEntradaDiarioDTO) =>
        Promise.resolve({ ...data, id: 1, user_id: _userId })
      ),
  },
}))

describe("diary default date", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("usa fecha de hoy si no se envía watched_date", async () => {
    const res = await crearEntradaDiarioService(1, { movie_id: 2 })
    expect(res.watched_date).toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(diaryRepository.create).toHaveBeenCalled()
  })
})
