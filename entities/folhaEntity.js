import Entity from "./entity.js";


export default class FolhaEntity extends Entity{
    #id;
    #ano;
    #mes;
    #valorTotal;

    get id() { return this.#id;}
    set id(value) {this.#id = value;}

    get ano(){ return this.#ano;}
    set ano(value){this.#ano = value;}

    get mes(){ return this.#mes;}
    set mes(value){this.#mes = value;}

    get valorTotal(){return this.#valorTotal;}
    set valorTotal(value){this.#valorTotal = value;}

    constructor(id, ano, mes, valorTotal = 0){
        super();
        this.#id = id;
        this.#ano = ano;
        this.#mes = mes;
        this.#valorTotal = valorTotal;
    }

    validar(){
        if(!this.#mes || this.#mes < 1 || this.#mes > 12) return false;
        if(!this.#ano || this.#ano <= 0) return false;
        return true;
    }

    static toMap(row){
        return new FolhaEntity(
            row["fol_id"], row["fol_ano"], row["fol_mes"], row["fol_valortotal"]
        );
    }
}