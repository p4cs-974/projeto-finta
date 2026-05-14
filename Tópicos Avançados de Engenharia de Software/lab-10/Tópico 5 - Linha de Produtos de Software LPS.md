# Tópico 5: Linha de Produto de Software (LPS)

> Convertido de `Tópico 5 - Linha de Produtos de Software LPS.pdf`. As imagens dos slides estão em `Tópico 5 - Linha de Produtos de Software LPS.assets/`.


---

## 1. TÓPICO 5:

![Slide 1](Tópico 5 - Linha de Produtos de Software LPS.assets/page-01.png)


### Texto extraído

```text
TÓPICO 5:

LINHA DE PRODUTO
   DE SOFTWARE
       LPS
```


---

## 2. Uma empresa precisa desenvolver:

![Slide 2](Tópico 5 - Linha de Produtos de Software LPS.assets/page-02.png)


### Texto extraído

```text
Uma empresa precisa desenvolver:

1. um sistema básico

2. um sistema intermediário

3. um sistema avançado


Vocês fariam três sistemas do zero?
```


---

## 3.  Dividir o sistema em partes do

![Slide 3](Tópico 5 - Linha de Produtos de Software LPS.assets/page-03.png)


### Texto extraído

```text
- Dividir o sistema em partes do
SISTEMA
            negócio (DDD)
          - Dividir o sistema em serviços
            (Microserviços)



             Reutilizar essas partes e
             montar produtos diferentes
             com elas”
```


---

## 4. Slide 4

![Slide 4](Tópico 5 - Linha de Produtos de Software LPS.assets/page-04.png)


> Sem texto extraível nesta página; consulte a imagem do slide.


---

## 5. Linha de Produto de Software (LPS)

![Slide 5](Tópico 5 - Linha de Produtos de Software LPS.assets/page-05.png)


### Texto extraído

```text
Linha de Produto de Software (LPS)


                     pertencem a
                                         Domínio


                     compartilham uma
                                         Arquitetura
   Produtos


   Funcionalidades
      comuns e       construídos por
      variáveis                         Componentes
```


---

## 6. O que é uma LPS ?

![Slide 6](Tópico 5 - Linha de Produtos de Software LPS.assets/page-06.png)


### Texto extraído

```text
O que é uma LPS ?

- Conjunto de sistemas de software que
  compartilham características comuns, mas
  variam em certas funcionalidades.
- Componentes principais:
  - núcleo (comuns),
  - variabilidades,
  - produtos derivados.
```


---

## 7. Problemas que resolve uma LPS

![Slide 7](Tópico 5 - Linha de Produtos de Software LPS.assets/page-07.png)


### Texto extraído

```text
Problemas que resolve uma LPS
 Sem LPS:
 - retrabalho
 - inconsistência
 - alto custo

 Com LPS:
 - reuso
 - padronização
 - agilidade
```


---

## 8. Processos de uma LPS

![Slide 8](Tópico 5 - Linha de Produtos de Software LPS.assets/page-08.png)


### Texto extraído

```text
Processos de uma LPS
```


---

## 9. ENGENHARIA DE

![Slide 9](Tópico 5 - Linha de Produtos de Software LPS.assets/page-09.png)


### Texto extraído

```text
ENGENHARIA DE
   DOMÍNIO
```


---

## 10. LPS – Engenharia de Domínio

![Slide 10](Tópico 5 - Linha de Produtos de Software LPS.assets/page-10.png)


### Texto extraído

```text
LPS – Engenharia de Domínio


 1. Identificar Requisitos Comuns


 2. Identificar variabilidades

 3. Criar Modelo de Features
```


---

## 11. LPS – Engenharia de Domínio

![Slide 11](Tópico 5 - Linha de Produtos de Software LPS.assets/page-11.png)


### Texto extraído

```text
LPS – Engenharia de Domínio

 Modelo de Features:
 - Identificar o que é comum;
 - Identificar o que varia;
 - Organizar produtos da linha.
 Ele ajuda a responder:
   - O que todos os produtos possuem?
   - O que é opcional?
   - O que muda entre clientes?
```


---

## 12. LPS – Engenharia de Domínio

![Slide 12](Tópico 5 - Linha de Produtos de Software LPS.assets/page-12.png)


### Texto extraído

```text
LPS – Engenharia de Domínio

 Tipos de Features:
 1. Obrigatórias (comum)

    - Existem em todos os produtos.

    - Exemplo: Login

    - Representa algo comum a toda a linha.
```


---

## 13. LPS – Engenharia de Domínio

![Slide 13](Tópico 5 - Linha de Produtos de Software LPS.assets/page-13.png)


### Texto extraído

```text
LPS – Engenharia de Domínio

 Tipos de Features:
 2. Opcionais

    - Podem ou não existir.

    - Exemplo: Chat online

    - Alguns clientes querem, outros não.
```


---

## 14. LPS – Engenharia de Domínio

![Slide 14](Tópico 5 - Linha de Produtos de Software LPS.assets/page-14.png)


### Texto extraído

```text
LPS – Engenharia de Domínio

 Tipos de Features:
 3. Alternativas

    - Escolhe-se apenas uma opção.

    - Exemplo:
          Política Pós venda:

          - Troca de Produtos

          - Reembolso

          - Crédito na loja
```


---

## 15. LPS – Engenharia de Domínio

![Slide 15](Tópico 5 - Linha de Produtos de Software LPS.assets/page-15.png)


### Texto extraído

```text
LPS – Engenharia de Domínio

 Tipos de Features:
 4. OR-Features

    - Pode escolher uma ou várias.

    - Exemplo:
       Métodos de autenticação:

          - senha

          - biometria

          - Google login
```


---

## 16. LPS – Engenharia de Domínio

![Slide 16](Tópico 5 - Linha de Produtos de Software LPS.assets/page-16.png)


### Texto extraído

```text
LPS – Engenharia de Domínio

Notação Features Model:
```


---

## 17. LPS – Engenharia de Domínio

![Slide 17](Tópico 5 - Linha de Produtos de Software LPS.assets/page-17.png)


### Texto extraído

```text
LPS – Engenharia de Domínio

 Como definir uma Features
 Uma feature deve:

 - representar valor para usuário ou negócio

 - ser identificável

 - descrever uma capacidade do sistema

 - ajudar a diferenciar produtos

      Features são usadas para modelar semelhanças e
      variabilidades em uma Linha de Produto de Software.
```


---

## 18. LPS – Engenharia de Domínio

![Slide 18](Tópico 5 - Linha de Produtos de Software LPS.assets/page-18.png)


### Texto extraído

```text
LPS – Engenharia de Domínio
```


---

## 19. LPS no Mundo Atual

![Slide 19](Tópico 5 - Linha de Produtos de Software LPS.assets/page-19.png)


### Texto extraído

```text
LPS no Mundo Atual
Como implementar LPS hoje?
- Arquitetura modular – separar o sistema
   em partes.

- Microserviços – implementam essas
   partes de forma independente

- Cloud – permite configurar a entrega de
   diferentes produtos.
```


---

## 20. LPS + Microserviços

![Slide 20](Tópico 5 - Linha de Produtos de Software LPS.assets/page-20.png)


### Texto extraído

```text
LPS + Microserviços
- LPS define variabilidade de negócio.

- Microserviços ajudam a implementar
   diferentes combinações de
   funcionalidades.
```


---

## 21. Exemplo

![Slide 21](Tópico 5 - Linha de Produtos de Software LPS.assets/page-21.png)


### Texto extraído

```text
Exemplo
Sistema de Pedidos Online de

Restaurantes
```


---

## 22. Subdomínios

![Slide 22](Tópico 5 - Linha de Produtos de Software LPS.assets/page-22.png)


### Texto extraído

```text
Subdomínios
```


---

## 23. Requisitos da LPS

![Slide 23](Tópico 5 - Linha de Produtos de Software LPS.assets/page-23.png)


### Texto extraído

```text
Requisitos da LPS
                      Requisitos Domínio
  ID                    Descrição do Requisitos                      Tipo
                                                                    Feature
RD01   O sistema deve permitir criar um pedido                     Comum
RD02   O sistema deve permitir adicionar itens ao pedido.          Comum
RD03   O sistema deve permitir definir a forma de recebimento do   Comum
       pedido.
RD04   O sistema deve permitir receber o pedido por entrega.       Alternativa
RD05   O sistema deve permitir retirar o pedido no local.          Alternativa
RD06   O sistema deve permitir acompanhar o status do pedido.      Opcional
RD07   O sistema deve permitir realizar pagamento online.          Opcional
RD08   O sistema deve permitir realizar pagamento com dinheiro     Alternativa

RD9    O sistema deve permitir realizar pagamento com pix          Alternativa
RD10   O sistema deve permitir realizar pagamento com cartão de    Alternativa
       crédito
```


---

## 24. O Modelo de Features

![Slide 24](Tópico 5 - Linha de Produtos de Software LPS.assets/page-24.png)


### Texto extraído

```text
O Modelo de Features




  Fora do modelo de features:
  -Autenticação: subdomínio genérico (não varia entre produtos)
  -Notificações: subdomínio genérico (não varia entre produtos)
```


---

## 25. Diagrama de Casos de Uso

![Slide 25](Tópico 5 - Linha de Produtos de Software LPS.assets/page-25.png)


### Texto extraído

```text
Diagrama de Casos de Uso
```


---

## 26. Bounded Context

![Slide 26](Tópico 5 - Linha de Produtos de Software LPS.assets/page-26.png)


### Texto extraído

```text
Bounded Context
```


---

## 27. Microserviços

![Slide 27](Tópico 5 - Linha de Produtos de Software LPS.assets/page-27.png)


### Texto extraído

```text
Microserviços
```


---

## 28. Produtos da LPS

![Slide 28](Tópico 5 - Linha de Produtos de Software LPS.assets/page-28.png)


### Texto extraído

```text
Produtos da LPS

 Produto 1 (Básico)   Produto 2 (Completo)
```
