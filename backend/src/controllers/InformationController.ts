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

//Simplemente buscar una persona para que con el click llevar a obtenerInformacion
export const buscarPersona = async (req: Request, res: Response) => {
    const query = req.query.query as string
    const data = await consultarTMDB("search/person", { query })
    res.status(200).json(data)
}

export const buscarTodo = async (req: Request, res: Response) => {
    const query = req.query.query as string
    const data = await consultarTMDB("search/multi", { query })
    res.status(200).json(data)
}

export const buscarPelicula = async (req: Request, res: Response) => {
    const query = req.query.query as string
    const data = await consultarTMDB("search/movie", { query })
    res.status(200).json(data)
}

export const buscarSerie = async (req: Request, res: Response) => {
    const query = req.query.query as string
    const data = await consultarTMDB("search/tv", { query })
    res.status(200).json(data)
}