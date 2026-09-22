import Database from "../db/database.js";
import AumentoEntity from "../entities/aumentoEntity.js";
import AumentoRepository from "../repositories/aumentoRepository.js";




export default class AumentoController{
    #repo;

    constructor(){
        this.#repo = new AumentoRepository();
    }

    async aplicarAumento(req,res){
        let banco = new Database();
        try{
            let {percentual} = req.body;
            let usuarioId = req.usuario.id;

            let entidade = new AumentoEntity(0, new Date(), percentual, usuarioId);

            await banco.AbreTransacao();
            this.#repo.banco = banco;

            if(entidade.validar()){
                let gravou = await this.#repo.gravar(entidade);

                if(gravou){
                    let aplicou = await this.#repo.aplicarAumentoFuncionarios(percentual);
                    if(aplicou){
                        await banco.Commit();
                        return res.status(200).json({ msg: "aumento salarial aplicado com sucesso!"});
                    }else{
                        throw new Error("Erro ao Atualizar os salarios dos funcionarios!");
                    }
                }else{
                    throw new Error("Erro ao gravar registro de aumento no banco!");
                }
            }else{
                    await banco.Rollback();
                    return res.status(400).json({msg: "perncentual de aumento invalido!"});
                }
        }catch(ex){
            await banco.Rollback();
            console.log(ex);
            return res.status(500).json({ msg: "Erro Interno no servidor"})
        }
    }
}