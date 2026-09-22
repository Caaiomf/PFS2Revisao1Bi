import Database from "../db/database.js";
import FolhaEntity from "../entities/folhaEntity.js";
import FolhaRepository from "../repositories/folhaRepository.js";




export default class FolhaController{
    #repo;

    constructor(){
        this.#repo = new FolhaRepository();
    }

    async gerarFolha(req,res){
        let banco = new Database();
        try{
            let{mes, ano} = req.body;
            let folha = new FolhaEntity(0, ano, mes, 0);

            await banco.AbreTransacao();
            this.#repo.banco = banco;

            if(folha.validar()){
                let funcionariosAtivos = await this.#repo.obterFuncionariosAtivos();

                if(!funcionariosAtivos || funcionariosAtivos.length === 0){
                    await banco.Rollback();
                    return res.status(400).json({ msg: "Não ha funcionarios ativos para gerar a folha!"});
                }

                let total = 0;
                for(let func of funcionariosAtivos){
                    total += parseFloat(func.fun_salario);
                }
                folha.valorTotal = total;

                let gravouFolha = await this.#repo.gravar(folha);

                if(gravouFolha){
                    for(let func of funcionariosAtivos){
                        let gravouItem = await this.#repo.gravarItem(func.fun_salario, func.fun_id, folha.id);

                        if(gravouItem == false){
                            throw new Error("Erro ao gravar item da folha de pagamento!");
                        }
                    }

                    await banco.Commit();
                    return res.status(201).json({
                        msg: "folha de pagamento gerada com sucesso", folhaId: folha.id, valorTotal: folha.valorTotal
                    });
                }else {
                    throw new Error("Erro ao gravar a folha de pgamento no banco!");
                }
            } else{
                await banco.Rollback();
                return res.status(400).json({msg: "Mês ou ano invalidos!"});
            }
        }catch(ex){
            await banco.Rollback();
            console.log(ex);
            return res.status(500).json({ msg: "erro interno no servidor"});
        }
    }
}