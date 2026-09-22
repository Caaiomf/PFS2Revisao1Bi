import Database from "../db/database.js";


export default class FolhaRepository {
    #banco; 

    set banco(value){

        this.#banco = value;
    }

    constructor(){
        this.#banco = new Database();
    }

    async obterFuncionariosAtivos(){
        let sql ="select * from tb_funcionario where fun_datademissao is null";
        return await this.#banco.ExecutaComando(sql);
    }

    async gravar(entidade){
        let sql = "insert into tb_folhapagamento(fol_ano, fol_mes, fol_valortotal) values(?,?,?)";
        let valores = [entidade.ano, entidade.mes, entidade.valorTotal];

        let idGerado = await this.#banco.ExecutaComandoLastInserted(sql, valores);
        if(idGerado){
            entidade.id = idGerado;
            return true;
        }
        return false;
    }

    async gravarItem(salario, funcionarioId, folhaId){
        let sql = "insert into tb_itensfolhapagamento(ifp_salario, fun_id, fol_id) values (?, ?, ?)";

        let valores = [salario, funcionarioId, folhaId];

        return await this.#banco.ExecutaComandoNonQuery(sql, valores);
    }
}