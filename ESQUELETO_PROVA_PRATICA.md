# 💻 GABARITO DE BOLSO: CÓDIGOS PARA PROVA PRÁTICA (FULL STACK II)

Este documento foi feito para quem vai **escrever código na hora da prova**.
Em provas práticas, o maior perigo é travar com a "tela em branco". Aqui estão os moldes exatos e os 5 códigos que o professor costuma pedir para você implementar do zero.

---

## 🏗️ 1. OS ESQUELETOS-PADRÃO (DECORAR A ESTRUTURA)

### 🔹 Esqueleto de uma ROTA (`routes/exemploRoute.js`)
```javascript
import express from "express";
import ExemploController from "../controllers/exemploController.js";
import AuthMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const ctrl = new ExemploController();
const auth = new AuthMiddleware();

// Rota protegida por autenticação:
router.post("/", auth.validar, (req, res) => {
    ctrl.metodo(req, res);
});

export default router;
```

---

### 🔹 Esqueleto do MIDDLEWARE JWT (`middlewares/authMiddleware.js`)
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
                req.usuario = objUsuario; // guarda o usuário para as próximas camadas
                next(); // ⚠️ OBRIGATÓRIO: passa para o controller
            } catch (ex) {
                return res.status(401).json({ msg: "Não autorizado!" });
            }
        } else {
            return res.status(401).json({ msg: "Não autorizado!" });
        }
    }
}
```

---

### 🔹 Esqueleto de um CONTROLLER COM TRANSAÇÃO (`controllers/exemploController.js`)
*Decore este fluxo: cria banco ➔ abre transação ➔ injeta no repo ➔ valida ➔ se ok commit, se erro rollback!*

```javascript
import Database from "../db/database.js";
import ExemploRepository from "../repositories/exemploRepository.js";

export default class ExemploController {
    #repo;
    constructor() {
        this.#repo = new ExemploRepository();
    }

    async executarAcao(req, res) {
        let banco = new Database();
        try {
            await banco.AbreTransacao();
            this.#repo.banco = banco; // ⚠️ OBRIGATÓRIO: passa a mesma conexão da transação

            // 1. Pega dados (req.body ou req.params)
            let { campo } = req.body;

            // 2. Validação
            if (!campo) {
                await banco.Rollback();
                return res.status(400).json({ msg: "Campo obrigatório!" });
            }

            // 3. Executa no repositório
            let resultado = await this.#repo.salvar(campo);
            if (resultado) {
                await banco.Commit(); // Grava permanentemente
                return res.status(201).json({ msg: "Criado com sucesso!" });
            } else {
                throw new Error("Erro na gravação!");
            }
        } catch (ex) {
            await banco.Rollback(); // Desfaz qualquer alteração
            console.log(ex);
            return res.status(500).json({ msg: "Erro interno no servidor" });
        }
    }
}
```

---

### 🔹 Esqueleto de um REPOSITORY (`repositories/exemploRepository.js`)
```javascript
import Database from "../db/database.js";

export default class ExemploRepository {
    #banco;
    set banco(value) { this.#banco = value; }
    constructor() { this.#banco = new Database(); }

    // Exemplo de INSERT (retorna ID gerado):
    async inserir(nome, valor) {
        let sql = "INSERT INTO tb_exemplo (nome, valor) VALUES (?, ?)";
        let valores = [nome, valor];
        let idGerado = await this.#banco.ExecutaComandoLastInserted(sql, valores);
        return idGerado > 0;
    }

    // Exemplo de UPDATE / DELETE (retorna true/false):
    async atualizar(id, valor) {
        let sql = "UPDATE tb_exemplo SET valor = ? WHERE id = ?";
        let valores = [valor, id];
        return await this.#banco.ExecutaComandoNonQuery(sql, valores);
    }

    // Exemplo de SELECT (retorna array de linhas):
    async listarAtivos() {
        let sql = "SELECT * FROM tb_exemplo WHERE ativo = 1";
        return await this.#banco.ExecutaComando(sql);
    }
}
```

---

## 🎯 2. OS 4 CÓDIGOS REAIS DA SUA PROVA (PASSO A PASSO)

### Código 1: Demissão Lógica (Controller + Repository)
* **Controller:**
```javascript
async demitir(req, res) {
    let banco = new Database();
    try {
        let { id } = req.params; // ⚠️ Pega da URL!
        await banco.AbreTransacao();
        this.#repo.banco = banco;

        if (await this.#repo.obterPorId(id)) {
            let result = await this.#repo.demitir(id);
            if (result) {
                await banco.Commit();
                return res.status(200).json({ msg: "Funcionario demitido com sucesso!" });
            }
            throw new Error("Erro ao demitir!");
        } else {
            await banco.Rollback();
            return res.status(404).json({ msg: "Funcionario nao encontrado!" });
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

---

### Código 2: Aumento Salarial em Lote
* **Controller:**
```javascript
async aplicarAumento(req, res) {
    let banco = new Database();
    try {
        let { percentual } = req.body;
        let usuarioId = req.usuario.id; // ⚠️ Pega do token decodificado pelo middleware!

        let entidade = new AumentoEntity(0, new Date(), percentual, usuarioId);
        await banco.AbreTransacao();
        this.#repo.banco = banco;

        if (entidade.validar()) {
            let gravou = await this.#repo.gravar(entidade);
            if (gravou) {
                let aplicou = await this.#repo.aplicarAumentoFuncionarios(percentual);
                if (aplicou) {
                    await banco.Commit();
                    return res.status(200).json({ msg: "Aumento aplicado com sucesso!" });
                }
            }
            throw new Error("Erro ao aplicar aumento!");
        } else {
            await banco.Rollback();
            return res.status(400).json({ msg: "Percentual inválido!" });
        }
    } catch (ex) {
        await banco.Rollback();
        return res.status(500).json({ msg: "Erro interno" });
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

---

### Código 3: Geração da Folha de Pagamento (O mais completo)
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
                return res.status(400).json({ msg: "Não ha funcionarios ativos!" });
            }

            // 1. Calcula o total somando os salários
            let total = 0;
            for (let func of funcionariosAtivos) {
                total += parseFloat(func.fun_salario);
            }
            folha.valorTotal = total;

            // 2. Grava a folha mestre
            let gravouFolha = await this.#repo.gravar(folha);
            if (gravouFolha) {
                // 3. Grava cada item da folha
                for (let func of funcionariosAtivos) {
                    let gravouItem = await this.#repo.gravarItem(func.fun_salario, func.fun_id, folha.id);
                    if (!gravouItem) {
                        throw new Error("Erro ao gravar item!");
                    }
                }
                await banco.Commit();
                return res.status(201).json({ msg: "Folha gerada com sucesso!", folhaId: folha.id, valorTotal: total });
            }
            throw new Error("Erro ao gravar folha!");
        } else {
            await banco.Rollback();
            return res.status(400).json({ msg: "Mês ou ano inválidos!" });
        }
    } catch (ex) {
        await banco.Rollback();
        return res.status(500).json({ msg: "Erro interno no servidor" });
    }
}
```

---

## ✅ 3. CHECKLIST ANTES DE SALVAR QUALQUER ARQUIVO NA PROVA
1. **Esqueceu o `next()` no Middleware?** Se esquecer, a requisição trava para sempre.
2. **Passou a conexão para o repositório?** `this.#repo.banco = banco;` (logo após `AbreTransacao`).
3. **Colocou `WHERE fun_datademissao IS NULL`?** Obrigatório no aumento e na listagem para folha.
4. **Colocou `await banco.Rollback()` antes dos `return res.status(400)`?** Se validar e falhar, tem que dar rollback antes de retornar.
5. **Usou o método certo do Database?**
   * Consulta ➔ `ExecutaComando`
   * Insert ➔ `ExecutaComandoLastInserted`
   * Update/Delete ➔ `ExecutaComandoNonQuery`
