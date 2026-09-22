import Database from "../db/database.js"

export default class AumentoRepository{
    #banco;

    set banco(value){
        this.#banco = value;
    }

    constructor(){
        this.#banco = new Database();
    }

    async gravar(entidade){
        let sql = "insert into tb_aumentosalario (aus_data, aus_percentual, usu_id) values (curdate(), ?,?)";
        let valores = [entidade.percentual, entidade.usuarioId];

        let idGerado = await this.#banco.ExecutaComandoLastInserted(sql, valores);
        if(idGerado){
            entidade.id = idGerado;
            return true;
        }
        return false;
    }

    async aplicarAumentoFuncionarios(percentual){
        let sql = "update tb_funcionario set fun_salario = fun_salario * (1 + ? / 100) where fun_datademissao is null";
        let valores = [percentual];

        let result = await this.#banco.ExecutaComandoNonQuery(sql,valores);
        return result;
    }

}
