import Entity from "./entity.js";

export default class FuncionarioEntity extends Entity{
    #id;
    #cpf;
    #nome;
    #salario;
    #dataAdmissao;
    #cargoId;
    #dataDemissao;


    get id(){
        return this.#id
    }
    set id(value){
        this.#id = value;
    }

    get nome(){
        return this.#nome
    }
    set nome(value){
        this.#nome = value;
    }

    get cpf(){
        return this.#cpf
    }
    set cpf(value){
        this.#cpf = value;
    }

    get salario(){
        return this.#salario
    }
    set salario(value){
        this.#salario = value;
    }

    get dataAdmissao(){
        return this.#dataAdmissao;
    }
    set dataAdmissao(value){
        this.#dataAdmissao = value;
    }
    get cargoId(){
        return this.#cargoId;
    }
    set cargoId(value){
        this.#cargoId = value;
    }

    get dataDemissao(){
        return this.#dataDemissao
    }
    set dataDemissao(value){
        this.#dataDemissao = value;
    }

    validar(){
        if(!this.#cpf || this.#cpf.length != 11)
            return false;
        if(!this.#nome || this.#nome.trim() == "")
            return false;
        if(!this.#salario || this.#salario <= 0)
            return false;
        if(!this.#dataAdmissao)
            return false;
        if(!this.#cargoId || this.#cargoId<= 0)
            return false;

        return true;
    }
    constructor(id, cpf, nome, salario, dataAdmissao,cargoId, dataDemissao = null){
        super();
        this.#id = id;
        this.#cpf = cpf;
        this.#nome = nome;
        this.#salario = salario;
        this.#dataAdmissao = dataAdmissao;
        this.#cargoId = cargoId;
        this.#dataDemissao = dataDemissao;
    }

    static toMap(row){
        return new FuncionarioEntity(row["fun_id"], row["fun_cpf"], row["fun_nome"], row["fun_salario"], row["fun_datadmissao"], row["car_id"], row["fun_datademissao"])
    }

}