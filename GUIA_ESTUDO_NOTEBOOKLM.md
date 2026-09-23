# 📚 GUIA DEFINITIVO DE ESTUDOS: API DE RECURSOS HUMANOS (FULL STACK II)

Este documento foi estruturado especificamente como **Fonte de Conhecimento Mestre** para estudo, revisão rápida e upload no **NotebookLM** (geração de Guia de Estudo, Flashcards e Áudio/Podcast).

---

## 🧭 1. VISÃO GERAL DA ARQUITETURA DA APLICAÇÃO

A aplicação é uma **API RESTful** desenvolvida em **Node.js com Express** e banco de dados relacional **MySQL (mysql2)**.
Ela segue o padrão de arquitetura em camadas bem definido:

```
[Cliente HTTP / Postman / Swagger]
               │
               ▼
      [routes/*.js]           -> Roteamento e interceptação por middlewares
               │
               ▼
   [middlewares/authMiddleware] -> Autenticação e autorização via JWT em Cookies
               │
               ▼
     [controllers/*.js]       -> Regras de orquestração, controle de transações (ACID) e resposta HTTP
         │          │
         ▼          ▼
   [entities/*.js] [repositories/*.js] -> Validação de domínio e execução de comandos SQL
                            │
                            ▼
                    [db/database.js]   -> Pool de conexões MySQL e controle de transação
```

### Papel de Cada Camada:
1. **`server.js`**: Ponto de entrada. Configura o Express, parser de JSON (`express.json()`), parser de cookies (`cookieParser()`), documentação Swagger (`/docs`) e os roteadores (`/funcionario`, `/rh`, `/aumento`, `/folha`).
2. **`routes/`**: Associa os verbos HTTP (`POST`, `DELETE`, etc.) às ações dos controllers e aplica o middleware de proteção (`auth.validar`).
3. **`middlewares/authMiddleware.js`**: Valida o token JWT armazenado no cookie `token` em requisições protegidas e gera o token no login.
4. **`controllers/`**: Recebe `req` e `res`. Instancia a Entidade, valida os dados de entrada, controla o ciclo de vida da **Transação do Banco de Dados** (`AbreTransacao`, `Commit`, `Rollback`), chama o repositório e retorna o status HTTP adequado.
5. **`entities/`**: Classes orientadas a objetos com campos privados (`#campo`), métodos getters/setters, validações de regras de negócio (`validar()`) e mapeamento relacional (`toMap()`).
6. **`repositories/`**: Isolamento de acesso a dados. Contém os comandos SQL parametrizados (usando placeholders `?` contra SQL Injection).
7. **`db/database.js`**: Gerencia o pool de conexão MySQL, fornecendo métodos de execução de query e controle manual de transações (`START TRANSACTION`, `COMMIT`, `ROLLBACK`).

---

## 🗄️ 2. MODELO DE DADOS E TABELAS (BD.SQL)

1. **`tb_cargo`**:
   * `car_id` (PK, auto_increment): Identificador do cargo.
   * `car_descricao`: Nome do cargo (ex: Analista de Sistemas, Suporte).
2. **`tb_funcionario`**:
   * `fun_id` (PK, auto_increment): Identificador do funcionário.
   * `fun_cpf` (varchar 11): CPF (deve ter exatamente 11 dígitos).
   * `fun_nome` (varchar 200): Nome completo.
   * `fun_salario` (decimal 8,2): Salário atual.
   * `fun_datadmissao` (date): Data de admissão na empresa.
   * `fun_datademissao` (date, nullable): Data de desligamento. **Quando NULL, o funcionário está ATIVO**. Quando preenchida, o funcionário é considerado DEMITIDO.
   * `car_id` (FK -> tb_cargo): Cargo do funcionário.
3. **`tb_usuariorh`**:
   * `usu_id` (PK, auto_increment): ID do usuário do sistema de RH.
   * `usu_nome`, `usu_email`, `usu_senha`: Credenciais.
   * `usu_ativo` (bool): Apenas usuários ativos (`1`) podem se autenticar.
4. **`tb_aumentosalario`**:
   * `aus_id` (PK, auto_increment): ID do registro de aumento.
   * `aus_data` (date): Data em que o aumento foi concedido.
   * `aus_percentual` (decimal 4,2): Percentual de aumento aplicado (ex: 10.00%).
   * `usu_id` (FK -> tb_usuariorh): Usuário do RH que autorizou o aumento.
5. **`tb_folhapagamento`** (Tabela Mestre):
   * `fol_id` (PK, auto_increment): ID da folha.
   * `fol_ano` (int), `fol_mes` (int): Período de competência.
   * `fol_valortotal` (decimal 10,2): Somatório dos salários dos funcionários ativos na data da geração.
6. **`tb_itensfolhapagamento`** (Tabela Detalhe):
   * `ifp_id` (PK, auto_increment): ID do item.
   * `ifp_salario` (decimal 8,2): Salário do funcionário no momento do fechamento da folha.
   * `fun_id` (FK -> tb_funcionario): Funcionário correspondente.
   * `fol_id` (FK -> tb_folhapagamento): Folha à qual este item pertence.

---

## 🎯 3. AS 4 GRANDES QUESTÕES DA PROVA (EXPLICADAS A FUNDO)

---

### QUESTÃO 1: Autenticação e Segurança com JWT
* **Objetivo:** Autenticar operadores do RH e proteger todas as rotas da API.
* **Tabela envolvida:** `tb_usuariorh`.
* **Endpoints:**
  * `POST /rh/login`: Rota pública.
* **Regras de Negócio e Implementação:**
  1. O usuário envia `email` e `senha`.
  2. O repositório busca com:
     ```sql
     SELECT * FROM tb_usuariorh WHERE usu_email = ? AND usu_senha = ? AND usu_ativo = 1;
     ```
  3. Se encontrado, o método `gerarToken(id, nome, email)` gera um JWT assinado com a chave secreta (`vale10`) e tempo de expiração de **5 horas** (`expiresIn: 18000` segundos).
  4. O token é gravado num cookie com a flag de segurança **`httpOnly: true`**:
     ```javascript
     res.cookie("token", token, { httpOnly: true });
     ```
  5. O token também é retornado no corpo da resposta JSON com status `200 OK`.
  6. **Middleware `AuthMiddleware.validar`**:
     * Lê `req.cookies.token`.
     * Executa `jwt.verify(token, SEGREDO)`.
     * Se válido, insere o usuário decodificado na requisição: `req.usuario = objUsuario;` e prossegue com `next()`.
     * Se ausente ou inválido, retorna status `401 Unauthorized`.

---

### QUESTÃO 2: Gerenciamento de Funcionários e Exclusão Lógica
* **Objetivo:** Cadastrar novos colaboradores e efetuar demissões.
* **Tabela envolvida:** `tb_funcionario`.
* **Endpoints:**
  * `POST /funcionario`: Cadastra funcionário (protegido por JWT).
  * `DELETE /funcionario/:id`: Demite funcionário (protegido por JWT).
* **Regras de Negócio:**
  1. **Cadastro:**
     * `fun_datademissao` **NÃO** deve ser preenchida na contratação (fica `NULL`).
     * Validações na Entidade: CPF com 11 dígitos, nome não vazio, salário > 0, cargoId > 0.
     * Retorno: `201 Created` com a entidade criada contendo o ID gerado.
  2. **Exclusão Lógica (Demissão):**
     * **Conceito Fundamental:** Não se deleta fisicamente o registro com `DELETE FROM` para não perder integridade histórica nem quebrar referências em folhas passadas.
     * Executa-se um `UPDATE` preenchendo a data de demissão com a data corrente:
       ```sql
       UPDATE tb_funcionario SET fun_datademissao = CURDATE() WHERE fun_id = ?;
       ```
     * Verifica antes se o funcionário existe (`obterPorId`). Se não existir, responde `404 Not Found`. Se demitido com sucesso, `200 OK`.

---

### QUESTÃO 3: Aumento Salarial em Lote com Histórico
* **Objetivo:** Conceder reajuste salarial a todos os funcionários ativos simultaneamente e registrar quem fez a operação.
* **Tabelas envolvidas:** `tb_aumentosalario` e `tb_funcionario`.
* **Endpoint:**
  * `POST /aumento`: Recebe `{ "percentual": 10 }` (protegido por JWT).
* **Regras de Negócio:**
  1. **Auditoria de Usuário:** O sistema obtém quem está concedendo o aumento direto do payload do token JWT através de `req.usuario.id`.
  2. **Validação:** O percentual deve ser um número maior que zero.
  3. **Registro do Histórico:** Salva na `tb_aumentosalario`:
     ```sql
     INSERT INTO tb_aumentosalario (aus_data, aus_percentual, usu_id) VALUES (CURDATE(), ?, ?);
     ```
  4. **Atualização em Massa no Banco:**
     ```sql
     UPDATE tb_funcionario 
     SET fun_salario = fun_salario * (1 + ? / 100) 
     WHERE fun_datademissao IS NULL;
     ```
     *Nota:* A condição `WHERE fun_datademissao IS NULL` garante que funcionários desligados **não** recebam aumento.
  5. **Controle Transacional:** Ambas as operações (gravar histórico e reajustar salários) são envolvidas em uma transação (`AbreTransacao`, `Commit` e `Rollback`).

---

### QUESTÃO 4: Geração de Folha de Pagamento com Transação ACID
* **Objetivo:** Fechar a folha do mês somando os salários e registrando o snapshot dos valores para cada funcionário.
* **Tabelas envolvidas:** `tb_folhapagamento` e `tb_itensfolhapagamento`.
* **Endpoint:**
  * `POST /folha`: Recebe `{ "mes": 9, "ano": 2026 }` (protegido por JWT).
* **Regras de Negócio e Passo a Passo:**
  1. Valida mês (1 a 12) e ano (> 0).
  2. Inicia transação: `await banco.AbreTransacao();`
  3. Busca apenas colaboradores em atividade:
     ```sql
     SELECT * FROM tb_funcionario WHERE fun_datademissao IS NULL;
     ```
  4. Se não existirem funcionários ativos, cancela a transação (`banco.Rollback()`) e responde erro `400`.
  5. Calcula o somatório dos salários:
     $$\text{valorTotal} = \sum \text{salario de cada funcionário ativo}$$
  6. Insere o registro principal na `tb_folhapagamento (fol_ano, fol_mes, fol_valortotal)` e obtém o `fol_id` gerado via `ExecutaComandoLastInserted`.
  7. Itera sobre cada funcionário ativo inserindo uma linha na `tb_itensfolhapagamento`:
     ```sql
     INSERT INTO tb_itensfolhapagamento (ifp_salario, fun_id, fol_id) VALUES (?, ?, ?);
     ```
  8. Se todos os itens forem gravados com sucesso: `await banco.Commit();` e retorna status `201 Created`.
  9. Se qualquer inserção falhar ou lançar erro: `await banco.Rollback();` no bloco `catch` e responde status `500`.

---

## ⚡ 4. MECANISMO DE TRANSAÇÕES NO MYSQL (POR QUE É VITAL?)

Na geração da folha e no aumento, existem múltiplas operações de escrita interdependentes.
Se a inserção do 10º funcionário na tabela de itens falhar, os 9 primeiros e a folha mestre **não podem ficar gravados**, pois gerariam dados inconsistentes e corrupção financeira.

### As propriedades ACID demonstradas:
* **Atomicidade:** Ou tudo é gravado com sucesso (`Commit`), ou nada é gravado (`Rollback`).
* **Consistência:** O saldo total da folha sempre baterá com a soma dos seus itens correspondentes.
* **Isolamento:** Outras consultas não leem itens pela metade enquanto a transação estiver em andamento.
* **Durabilidade:** Uma vez feito o `Commit`, os dados estão salvos em disco permanentemente.

### O detalhe da injeção de conexão no Repositório:
No controller, é feito:
```javascript
let banco = new Database();
await banco.AbreTransacao();
this.#repo.banco = banco;
```
**Importante para a prova:** O repositório precisa receber essa mesma instância `banco` para que as queries subsequentes sejam executadas **na mesma conexão onde a transação foi aberta**. Se usasse outra instância, seria outra conexão do pool e os comandos não fariam parte da transação!

---

## 📊 5. TABELA DE CÓDIGOS DE RESPOSTA HTTP (REST STANDARD)

| Código | Significado | Onde é usado no projeto |
| :--- | :--- | :--- |
| **`200 OK`** | Sucesso em requisição padrão | Login com sucesso, demissão de funcionário, aumento aplicado. |
| **`201 Created`** | Recurso criado com sucesso | Cadastro de funcionário (`POST /funcionario`), geração de folha (`POST /folha`). |
| **`400 Bad Request`** | Parâmetros inválidos enviados pelo cliente | Falha na validação de campos (CPF inválido, salário zerado, percentual <= 0, mês fora de 1-12). |
| **`401 Unauthorized`** | Falha de autenticação ou token ausente/expirado | Token JWT inválido/expirado no middleware ou login com senha incorreta. |
| **`404 Not Found`** | Recurso não localizado | Tentativa de demitir funcionário com ID inexistente no banco. |
| **`500 Internal Server Error`** | Erro não tratado no servidor ou falha de banco | Exceção capturada no bloco `catch` do controller. |

---

## 🛠️ 6. MÉTODOS DA CLASSE DATABASE (`db/database.js`)

* **`ExecutaComando(sql, valores)`**: Utilizado primordialmente para `SELECT`. Executa a query e devolve o array com as linhas resultantes (`results`).
* **`ExecutaComandoNonQuery(sql, valores)`**: Utilizado para `UPDATE` e `DELETE`. Retorna um booleano (`true` se `results.affectedRows > 0`).
* **`ExecutaComandoLastInserted(sql, valores)`**: Utilizado para `INSERT`. Retorna o ID gerado automaticamente (`results.insertId`).

---

## ❓ 7. PERGUNTAS E RESPOSTAS FREQUENTES (FAQ PARA O NOTEBOOKLM)

**P1: Por que é usada exclusão lógica na demissão em vez de exclusão física?**  
*R:* Para garantir a integridade referencial e o histórico financeiro da empresa. Se um funcionário fosse deletado com `DELETE FROM`, os registros de folhas de pagamento passadas nas quais ele recebia salário ficariam órfãos ou causariam erro de Foreign Key.

**P2: Onde fica armazenado o token JWT do usuário e qual sua validade?**  
*R:* Fica armazenado nos cookies do navegador sob o nome `token`, com o atributo `httpOnly: true` (protegendo contra ataques XSS). Sua validade é de 18.000 segundos, equivalendo a 5 horas.

**P3: Como a rota de aumento sabe qual usuário concedeu o reajuste sem receber o ID no corpo da requisição?**  
*R:* O middleware `AuthMiddleware` decodifica o JWT enviado no cookie e anexa o objeto do usuário na requisição (`req.usuario`). O controller acessa diretamente `req.usuario.id`.

**P4: Por que a folha de pagamento faz `Rollback` se a lista de funcionários ativos estiver vazia?**  
*R:* Não faz sentido de negócio gerar uma folha de pagamento vazia com valor total zerado sem nenhum colaborador ativo para receber. A transação é abortada e uma mensagem 400 é retornada.
