import { Request, Response } from "express"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

export const obtenerInformacion = async (req: Request, res: Response) => {
    const { id } = req.params
    const data = await consultarTMDB(`person/${id}`)
    res.status(200).json(data)
}

export const obtenerInformacionCombinada = async (req: Request, res: Response) => {
    const { id } = req.params
    const data = await consultarTMDB(`person/${id}/combined_credits`)
    res.status(200).json(data)
}