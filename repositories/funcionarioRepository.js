import Database from "../db/database.js"
import FuncionarioEntity from "../entities/funcionarioEntity.js";


export default class FuncionarioRepository{

    #banco;

    set banco(value){
        this.#banco = value;
    }
    constructor(){
        this.#banco = new Database();
    }

    async cadastrar(entidade){
        let sql = "insert into tb_funcionario (fun_cpf, fun_nome, fun_salario, fun_datadmissao, car_id) values (?, ?, ?, ?, ?)";
        let valores = [entidade.cpf, entidade.nome, entidade.salario, entidade.dataAdmissao, entidade.cargoId];

        let idGerado = await this.#banco.ExecutaComandoLastInserted(sql,valores);
        if(idGerado){
            entidade.id = idGerado;
            return true;
        }
        return false; 
    }

    async demitir(id) {
        let sql = "update tb_funcionario set fun_datademissao = curdate() where fun_id = ?";

        let valores = [id];

        let result = await this.#banco.ExecutaComandoNonQuery(sql,valores);
        return result;
    }
    
    async obterPorId(id)
    {
        let sql = "select * from tb_funcionario where fun_id = ?";
        let valores = [id];

        let rows = await this.#banco.ExecutaComando(sql, valores);
        if(rows && rows.length > 0 ){
            return FuncionarioEntity.toMap(rows[0]);
        }
        return null;
    }
}
