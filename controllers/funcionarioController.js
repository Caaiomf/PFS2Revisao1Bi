import FuncionarioEntity from "../entities/funcionarioEntity.js";
import FuncionarioRepository from "../repositories/funcionarioRepository.js";
import Database from "../db/database.js";



export default class FuncionarioController {
    #repo;

    constructor() {
        this.#repo = new FuncionarioRepository();
    }

    async cadastrar(req, res) {
        let banco = new Database();
        try {
            let { cpf, nome, salario, dataadmissao, cargo_id } = req.body;
            let entidade = new FuncionarioEntity(0, cpf, nome, salario, dataadmissao, cargo_id);

            await banco.AbreTransacao();
            this.#repo.banco = banco;

            if (entidade.validar()) {
                let result = await this.#repo.cadastrar(entidade);
                if (result) {
                    await banco.Commit();
                    return res.status(201).json(entidade);
                }
                throw new Error("Erro interno ao inserir funcionario no banco de dados");
            } else {
                await banco.Rollback();
                return res.status(400).json({ msg: "paramentros incorretos!" });
            }
        }
        catch (ex) {
            await banco.Rollback();
            console.log(ex);
            return res.status(500).json({ msg: "Erro interno no servidor" })
        }
    }
    async demitir(req, res) {
        let banco = new Database();
        try {
            let { id } = req.params;
            await banco.AbreTransacao();
            this.#repo.banco = banco;

            if (await this.#repo.obterPorId(id)) {
                let result = await this.#repo.demitir(id);
                if (result) {
                    await banco.Commit();
                    return res.status(200).json({ msg: "Funcionario demitido com sucesso!" });
                } else {
                    throw new Error("Erro durante exclusão do funcionario no banco de dados!");
                }
            } else {
                await banco.Rollback();
                return res.status(404).json({ msg: "Funcionario nao encontrado para deleção" })
            }
        } catch (ex) {
            await banco.Rollback();
            console.log(ex);
            return res.status(500).json({ msg: "Erro interno no servidor" })
        }
    }

}