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
  `usu_id` int NOT NULL AUTO_INCREMENT,
  `usu_nome` varchar(200) DEFAULT NULL,
  `usu_email` varchar(100) DEFAULT NULL,
  `usu_ativo` bool,
  `usu_senha` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`usu_id`)
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

insert into tb_cargo (car_descricao) values ("Analista de Sistemas");
insert into tb_cargo (car_descricao) values ("Analista de Testes");
insert into tb_cargo (car_descricao) values ("Coordenador");
insert into tb_cargo (car_descricao) values ("Suporte");

insert into tb_usuariorh (usu_nome, usu_email, usu_ativo, usu_senha) values ("Maria do RH", "maria@rh.com", 1, "123");
