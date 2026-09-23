# 🧠 CENTRAL DEFINITIVA DE ESTUDOS: API DE RECURSOS HUMANOS (NODE.JS + MYSQL)
> **Fonte Mestre Unificada para o NotebookLM**  
> Este documento concentra 100% do conteúdo necessário para a prova prática: Mapa Mental, Conceitos HTTP, Regras de Negócio das 4 Questões, Esqueletos de Código para Digitar na Prova e todo o Código-Fonte Real.

---

# 🗺️ BLOCO 1: O MAPA MENTAL COMPLETO

```text
API DE RECURSOS HUMANOS (FULL STACK II)
│
├── 🏛️ 1. ARQUITETURA EM CAMADAS
│   ├── Routes: Mapeia URLs e aplica middlewares de segurança
│   ├── Middlewares: Valida token JWT em cookies e injeta dados em req.usuario
│   ├── Controllers: Valida com Entidades, controla Transação (AbreTransacao/Commit/Rollback) e responde HTTP
│   ├── Repositories: Executa SQL parametrizado (?) via métodos do Database
│   ├── Entities: Classes com atributos privados (#), métodos validar() e toMap()
│   └── Database: Gerencia pool mysql2, transações atômicas e consultas
│
├── 🌐 2. CONCEITOS HTTP & REST
│   ├── Status 200 OK: Sucesso padrão (Login, Demissão, Aumento)
│   ├── Status 201 Created: Novo registro criado (POST /funcionario, POST /folha)
│   ├── Status 400 Bad Request: Dados inválidos enviados pelo cliente
│   ├── Status 401 Unauthorized: Sem token JWT, token expirado ou senha incorreta
│   ├── Status 404 Not Found: Recurso/ID não encontrado no banco
│   ├── Status 500 Internal Server Error: Falha capturada no catch (erro no banco)
│   ├── req.params: ID vindo na URL da rota (ex: DELETE /funcionario/:id)
│   └── req.body: Payload de dados complexos em JSON (POST e PUT)
│
├── 🔐 3. QUESTÃO 1: AUTENTICAÇÃO JWT
│   ├── Rota: POST /rh/login (verifica email, senha e usu_ativo = 1)
│   ├── Validade do Token: 5 horas (expiresIn: 18000 segundos)
│   ├── Armazenamento: Cookie com httpOnly: true (res.cookie('token', token, ...))
│   └── Middleware: Lê cookie, jwt.verify(token, 'vale10'), req.usuario = obj, next()
│
├── 👥 4. QUESTÃO 2: FUNCIONÁRIOS & DEMISSÃO
│   ├── Cadastro: POST /funcionario -> fun_datademissao inicia NULL (Status 201)
│   ├── Exclusão Lógica: DELETE /funcionario/:id (Status 200)
│   └── REGRA DE OURO: NUNCA usar DELETE FROM. Usa UPDATE fun_datademissao = CURDATE()
│
├── 💰 5. QUESTÃO 3: AUMENTO SALARIAL EM LOTE
│   ├── Rota: POST /aumento com { percentual: 10 }
│   ├── Auditoria: Salva na tb_aumentosalario usando o ID do operador (req.usuario.id)
│   ├── Atualização Coletiva: UPDATE tb_funcionario SET fun_salario = fun_salario * (1 + ? / 100)
│   └── FILTRO OBRIGATÓRIO: WHERE fun_datademissao IS NULL (só ativos)
│
└── 📄 6. QUESTÃO 4: FOLHA DE PAGAMENTO COM TRANSAÇÃO ACID
    ├── Rota: POST /folha com { mes, ano }
    ├── Estrutura Mestre-Detalhe: 1 folha (tb_folhapagamento) para N itens (tb_itensfolhapagamento)
    ├── Filtro: Apenas ativos (WHERE fun_datademissao IS NULL)
    ├── Cálculo: Soma dos salários de todos os ativos
    └── Transação Obrigatória: AbreTransacao() -> Grava Mestre -> Loop gravando Itens -> Commit() ou Rollback()
```

---

# 💻 BLOCO 2: GABARITO DE CÓDIGOS PARA A PROVA PRÁTICA

### 1. Molde do Middleware JWT (`middlewares/authMiddleware.js`)
```javascript
import jwt from "jsonwebtoken";
var SEGREDO = "vale10";

export default class AuthMiddleware {
    gerarToken(id, nome, email) {
        return jwt.sign({ id, nome, email }, SEGREDO, { expiresIn: 18000 }); // 5 horas
    }

    async validar(req, res, next) {
        let { token } = req.cookies;
        if (token) {
            try {
                let objUsuario = jwt.verify(token, SEGREDO);
                req.usuario = objUsuario;
                next(); // ⚠️ OBRIGATÓRIO: prossegue para o controller
            } catch (ex) {
                return res.status(401).json({ msg: "Não autorizado!" });
            }
        } else {
            return res.status(401).json({ msg: "Não autorizado!" });
        }
    }
}
```

### 2. Molde da Demissão Lógica (Controller + Repository)
* **Controller:**
```javascript
async demitir(req, res) {
    let banco = new Database();
    try {
        let { id } = req.params; // Pega da URL
        await banco.AbreTransacao();
        this.#repo.banco = banco;

        if (await this.#repo.obterPorId(id)) {
            let result = await this.#repo.demitir(id);
            if (result) {
                await banco.Commit();
                return res.status(200).json({ msg: "Funcionario demitido com sucesso!" });
            }
            throw new Error("Erro durante exclusão!");
        } else {
            await banco.Rollback();
            return res.status(404).json({ msg: "Funcionario nao encontrado para deleção" });
        }
    } catch (ex) {
        await banco.Rollback();
        return res.status(500).json({ msg: "Erro interno no servidor" });
    }
}
```
* **Repository:**
```javascript
async demitir(id) {
    let sql = "update tb_funcionario set fun_datademissao = curdate() where fun_id = ?";
    let valores = [id];
    return await this.#banco.ExecutaComandoNonQuery(sql, valores);
}
```

### 3. Molde do Aumento Salarial em Lote
* **Controller:**
```javascript
async aplicarAumento(req, res) {
    let banco = new Database();
    try {
        let { percentual } = req.body;
        let usuarioId = req.usuario.id; // Extrai do token decodificado pelo middleware

        let entidade = new AumentoEntity(0, new Date(), percentual, usuarioId);
        await banco.AbreTransacao();
        this.#repo.banco = banco;

        if (entidade.validar()) {
            let gravou = await this.#repo.gravar(entidade);
            if (gravou) {
                let aplicou = await this.#repo.aplicarAumentoFuncionarios(percentual);
                if (aplicou) {
                    await banco.Commit();
                    return res.status(200).json({ msg: "aumento salarial aplicado com sucesso!" });
                }
            }
            throw new Error("Erro ao aplicar aumento!");
        } else {
            await banco.Rollback();
            return res.status(400).json({ msg: "percentual de aumento invalido!" });
        }
    } catch (ex) {
        await banco.Rollback();
        return res.status(500).json({ msg: "Erro Interno no servidor" });
    }
}
```
* **Repository:**
```javascript
async aplicarAumentoFuncionarios(percentual) {
    let sql = "update tb_funcionario set fun_salario = fun_salario * (1 + ? / 100) where fun_datademissao is null";
    let valores = [percentual];
    return await this.#banco.ExecutaComandoNonQuery(sql, valores);
}
```

### 4. Molde da Folha de Pagamento com Transação
* **Controller:**
```javascript
async gerarFolha(req, res) {
    let banco = new Database();
    try {
        let { mes, ano } = req.body;
        let folha = new FolhaEntity(0, ano, mes, 0);

        await banco.AbreTransacao();
        this.#repo.banco = banco;

        if (folha.validar()) {
            let funcionariosAtivos = await this.#repo.obterFuncionariosAtivos();
            if (!funcionariosAtivos || funcionariosAtivos.length === 0) {
                await banco.Rollback();
                return res.status(400).json({ msg: "Não ha funcionarios ativos para gerar a folha!" });
            }

            let total = 0;
            for (let func of funcionariosAtivos) {
                total += parseFloat(func.fun_salario);
            }
            folha.valorTotal = total;

            let gravouFolha = await this.#repo.gravar(folha);
            if (gravouFolha) {
                for (let func of funcionariosAtivos) {
                    let gravouItem = await this.#repo.gravarItem(func.fun_salario, func.fun_id, folha.id);
                    if (!gravouItem) throw new Error("Erro ao gravar item da folha!");
                }
                await banco.Commit();
                return res.status(201).json({ msg: "folha gerada com sucesso", folhaId: folha.id, valorTotal: total });
            }
            throw new Error("Erro ao gravar folha!");
        } else {
            await banco.Rollback();
            return res.status(400).json({ msg: "Mês ou ano invalidos!" });
        }
    } catch (ex) {
        await banco.Rollback();
        return res.status(500).json({ msg: "erro interno no servidor" });
    }
}
```

---

# 📚 BLOCO 3: TEORIA, REGRAS DE NEGÓCIO E CHECKLIST

### As 5 Pegadinhas Clássicas que Tiram Nota:
1. **Filtro de demitidos ausente:** Folha e Aumento **sempre** exigem `WHERE fun_datademissao IS NULL`.
2. **Esquecer de passar conexão para o repositório:** `this.#repo.banco = banco;` logo após `AbreTransacao()`.
3. **Esquecer `next()` no middleware:** Faz a requisição travar sem resposta.
4. **Faltar `Rollback()` nas validações:** Se a validação do `if (!entidade.validar())` falhar, tem que rodar `await banco.Rollback()` antes do `return res.status(400)`.
5. **Métodos do Database:**
   * `ExecutaComando`: SELECT (retorna rows)
   * `ExecutaComandoNonQuery`: UPDATE/DELETE (retorna boolean)
   * `ExecutaComandoLastInserted`: INSERT (retorna insertId)

---

# 🗄️ BLOCO 4: CÓDIGOS COMPLETOS DE REFERÊNCIA

### `bd.sql`
```sql
create table tb_cargo (
	car_id int primary key auto_increment,
    car_descricao varchar(200)
);

create table tb_funcionario (
	fun_id int primary key auto_increment,
    fun_cpf varchar(11),
    fun_nome varchar(200),
    fun_salario decimal(8,2),
    fun_datadmissao date,
    fun_datademissao date,
    car_id int,
    constraint fk_funcionario_cargo foreign key (car_id) references tb_cargo (car_id)
);

CREATE TABLE tb_usuariorh (
  usu_id int NOT NULL AUTO_INCREMENT,
  usu_nome varchar(200) DEFAULT NULL,
  usu_email varchar(100) DEFAULT NULL,
  usu_ativo bool,
  usu_senha varchar(100) DEFAULT NULL,
  PRIMARY KEY (usu_id)
);

create table tb_aumentosalario (
	aus_id int primary key auto_increment,
    aus_data date,
    aus_percentual decimal (4,2),
    usu_id int,
    constraint fk_aumento_usuario foreign key (usu_id) references tb_usuariorh (usu_id)
);

create table tb_folhapagamento (
	fol_id int primary key auto_increment,
    fol_ano int,
    fol_mes int,
    fol_valortotal decimal(10,2)
);

create table tb_itensfolhapagamento (
	ifp_id int primary key auto_increment,
    ifp_salario decimal (8,2),
    fun_id int, 
    fol_id int,
    constraint fk_itemfolha_funcionario foreign key (fun_id) references tb_funcionario (fun_id),
    constraint fk_itemfolha_folha foreign key (fol_id) references tb_folhapagamento (fol_id)
);

insert into tb_cargo (car_descricao) values ("Analista de Sistemas"), ("Analista de Testes"), ("Coordenador"), ("Suporte");
insert into tb_usuariorh (usu_nome, usu_email, usu_ativo, usu_senha) values ("Maria do RH", "maria@rh.com", 1, "123");
```

### `db/database.js`
```javascript
import mysql from 'mysql2';

export default class Database {
    #conexao;
    get conexao() { return this.#conexao; } set conexao(conexao) { this.#conexao = conexao; }

    constructor() {
        this.#conexao = mysql.createPool({
            host: '132.226.245.178',
            database: 'PFS2_10442519293',
            user: '10442519293',
            password: '10442519293',
        });
    }

    AbreTransacao() {
        var cnn = this.#conexao;
        return new Promise(function(res, rej) {
            cnn.query("START TRANSACTION", function (error, results) {
                if (error) rej(error); else res(results);
            });
        });
    }
     
    Rollback() {
        var cnn = this.#conexao;
        return new Promise(function(res, rej) {
            cnn.query("ROLLBACK", function (error, results) {
                if (error) rej(error); else res(results);
            });
        });
    }
     
    Commit() {
        var cnn = this.#conexao;
        return new Promise(function(res, rej) {
            cnn.query("COMMIT", function (error, results) {
                if (error) rej(error); else res(results);
            });
        });
    }

    ExecutaComando(sql, valores) {
        var cnn = this.#conexao;
        return new Promise(function(res, rej) {
            cnn.query(sql, valores, function (error, results) {
                if (error) rej(error); else res(results);
            });
        });
    }
    
    ExecutaComandoNonQuery(sql, valores) {
        var cnn = this.#conexao;
        return new Promise(function(res, rej) {
            cnn.query(sql, valores, function (error, results) {
                if (error) rej(error); else res(results.affectedRows > 0);
            });
        });
    }

    ExecutaComandoLastInserted(sql, valores) {
        var cnn = this.#conexao;
        return new Promise(function(res, rej) {
            cnn.query(sql, valores, function (error, results) {
                if (error) rej(error); else res(results.insertId);
            });
        });
    }
}
```

### `controllers/rhController.js`
```javascript
import AuthMiddleware from "../middlewares/authMiddleware.js";
import RhRepository from "../repositories/rhRepository.js";

export default class RhController {
    #repo; #auth;
    constructor() {
        this.#repo = new RhRepository();
        this.#auth = new AuthMiddleware();
    }

    async login(req, res) {
        try {
            let { email, senha } = req.body;
            if (!email || !senha) return res.status(400).json({ msg: "Email e senha sao obrigatorios!" });

            let usuario = await this.#repo.autenticar(email, senha);
            if (usuario) {
                let token = this.#auth.gerarToken(usuario.id, usuario.nome, usuario.email);
                res.cookie("token", token, { httpOnly: true });
                return res.status(200).json({ msg: "Login realizado com sucesso!", token });
            }
            return res.status(401).json({ msg: "Email ou senha incorretos ou usuario inativo!" });
        } catch (ex) {
            return res.status(500).json({ msg: "erro interno no servidor" });
        }
    }
}
```

### `controllers/funcionarioController.js`
```javascript
import FuncionarioEntity from "../entities/funcionarioEntity.js";
import FuncionarioRepository from "../repositories/funcionarioRepository.js";
import Database from "../db/database.js";

export default class FuncionarioController {
    #repo;
    constructor() { this.#repo = new FuncionarioRepository(); }

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
                throw new Error("Erro ao inserir funcionario");
            } else {
                await banco.Rollback();
                return res.status(400).json({ msg: "paramentros incorretos!" });
            }
        } catch (ex) {
            await banco.Rollback();
            return res.status(500).json({ msg: "Erro interno no servidor" });
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
                }
                throw new Error("Erro na demissão");
            } else {
                await banco.Rollback();
                return res.status(404).json({ msg: "Funcionario nao encontrado para deleção" });
            }
        } catch (ex) {
            await banco.Rollback();
            return res.status(500).json({ msg: "Erro interno no servidor" });
        }
    }
}
```

### `repositories/rhRepository.js`
```javascript
import Database from "../db/database.js";
import RhEntity from "../entities/rhEntity.js";

export default class RhRepository {
    #banco;
    set banco(value) { this.#banco = value; }
    constructor() { this.#banco = new Database(); }

    async autenticar(email, senha) {
        let sql = "select * from tb_usuariorh where usu_email = ? and usu_senha = ? and usu_ativo = 1";
        let rows = await this.#banco.ExecutaComando(sql, [email, senha]);
        if (rows && rows.length > 0) return RhEntity.toMap(rows[0]);
        return null;
    }
}
```

### `repositories/funcionarioRepository.js`
```javascript
import Database from "../db/database.js";
import FuncionarioEntity from "../entities/funcionarioEntity.js";

export default class FuncionarioRepository {
    #banco;
    set banco(value) { this.#banco = value; }
    constructor() { this.#banco = new Database(); }

    async cadastrar(entidade) {
        let sql = "insert into tb_funcionario (fun_cpf, fun_nome, fun_salario, fun_datadmissao, car_id) values (?, ?, ?, ?, ?)";
        let valores = [entidade.cpf, entidade.nome, entidade.salario, entidade.dataAdmissao, entidade.cargoId];
        let idGerado = await this.#banco.ExecutaComandoLastInserted(sql, valores);
        if (idGerado) { entidade.id = idGerado; return true; }
        return false;
    }

    async demitir(id) {
        let sql = "update tb_funcionario set fun_datademissao = curdate() where fun_id = ?";
        return await this.#banco.ExecutaComandoNonQuery(sql, [id]);
    }
    
    async obterPorId(id) {
        let sql = "select * from tb_funcionario where fun_id = ?";
        let rows = await this.#banco.ExecutaComando(sql, [id]);
        if (rows && rows.length > 0) return FuncionarioEntity.toMap(rows[0]);
        return null;
    }
}
```

### `repositories/aumentoRepository.js`
```javascript
import Database from "../db/database.js";

export default class AumentoRepository {
    #banco;
    set banco(value) { this.#banco = value; }
    constructor() { this.#banco = new Database(); }

    async gravar(entidade) {
        let sql = "insert into tb_aumentosalario (aus_data, aus_percentual, usu_id) values (curdate(), ?, ?)";
        let idGerado = await this.#banco.ExecutaComandoLastInserted(sql, [entidade.percentual, entidade.usuarioId]);
        if (idGerado) { entidade.id = idGerado; return true; }
        return false;
    }

    async aplicarAumentoFuncionarios(percentual) {
        let sql = "update tb_funcionario set fun_salario = fun_salario * (1 + ? / 100) where fun_datademissao is null";
        return await this.#banco.ExecutaComandoNonQuery(sql, [percentual]);
    }
}
```

### `repositories/folhaRepository.js`
```javascript
import Database from "../db/database.js";

export default class FolhaRepository {
    #banco;
    set banco(value) { this.#banco = value; }
    constructor() { this.#banco = new Database(); }

    async obterFuncionariosAtivos() {
        let sql = "select * from tb_funcionario where fun_datademissao is null";
        return await this.#banco.ExecutaComando(sql);
    }

    async gravar(entidade) {
        let sql = "insert into tb_folhapagamento(fol_ano, fol_mes, fol_valortotal) values(?, ?, ?)";
        let idGerado = await this.#banco.ExecutaComandoLastInserted(sql, [entidade.ano, entidade.mes, entidade.valorTotal]);
        if (idGerado) { entidade.id = idGerado; return true; }
        return false;
    }

    async gravarItem(salario, funcionarioId, folhaId) {
        let sql = "insert into tb_itensfolhapagamento(ifp_salario, fun_id, fol_id) values (?, ?, ?)";
        return await this.#banco.ExecutaComandoNonQuery(sql, [salario, funcionarioId, folhaId]);
    }
}
```
