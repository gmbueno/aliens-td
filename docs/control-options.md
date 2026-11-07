# Opções de controle e suporte — para decisão

Propostas de design, pesquisadas em 7 de novembro de 2026. **Não implementadas nesta atualização.** O trabalho autorizado agora se limita à arte dos pisos/minas e ao slow opcional da Machine Pistol.

## O que aproveitar das referências

As notas oficiais de [Bloons TD6](https://store.steampowered.com/news/posts/?appids=960090&enddate=1739504393&feed=steam_community_announcements) tratam gelo, cola, atordoamento e sinergias como funções diferentes e ajustam duração, cobertura e frequência separadamente. O aprendizado útil é separar **atrasar continuamente**, **parar brevemente** e **criar uma janela para outra arma**, em vez de distribuir slow/burn por todo o catálogo.

A [Ironhide descreve os quartéis de Kingdom Rush Battles](https://support.ironhidegames.com/support/solutions/articles/4000223657-paladin-barracks-skills-breakdown-defend-the-lines-in-kingdom-rush-battles) como bloqueadores que seguram inimigos enquanto outras torres fazem o dano; precisam ter vulnerabilidades e não atingem voadores. Já [Element TD2](https://store.steampowered.com/app/1018830/Element_TD_2?l=english) enfatiza combinações e forças/fraquezas. A adaptação para Aliens TD seria um conjunto pequeno de interações legíveis, sem adicionar uma tabela enorme de elementos.

Não usei supostas mecânicas de “BTD7” como fatos: a pesquisa não encontrou documentação oficial verificável do jogo. As referências verificadas aqui são BTD6, Kingdom Rush e Element TD2.

## Seis propostas para o nosso jogo

| Opção | Funcionamento proposto | Como encaixar sem complicar | Limite importante |
| --- | --- | --- | --- |
| **Projetor de espuma** | Lança uma poça em 2–3 SQMs do caminho. Todo alien terrestre que cruza fica mais lento. Quase nenhum dano. | Uma arma especializada em controle de área; upgrades de cobertura/duração ou aderência. | Somente o maior slow vale; poças não multiplicam a lentidão. Não pega voadores. |
| **Criogel** | Acumula frio enquanto o inimigo permanece na área. Ao encher o medidor, congela por um instante. | Minha preferência é um caminho exclusivo do projetor de espuma, substituindo parte do slow por freeze, em vez de outra categoria. | Imunidade breve após congelar; chefes sofrem duração reduzida. Evita travamento permanente. |
| **Composto corrosivo** | Reduz temporariamente a armadura de quem atravessa a nuvem. As outras armas passam a causar mais dano. | Upgrade de especialização do Gas Emitter, dando a ele uma identidade diferente do Flamethrower. | Redução com teto e duração curta; não acumula entre várias nuvens. |
| **Relé de arco elétrico** | Um disparo salta entre poucos inimigos próximos, inclusive voadores, com bônus contra escudos. | Nova arma: anti-escudo/anti-grupo. Escolha entre mais saltos ou mais força no primeiro alvo. | Dano cai a cada salto; sem adicionar slow ou burn só para preencher upgrades. |
| **Barreira de sentinelas** | Uma estação manda dois pequenos robôs segurar alguns aliens terrestres. Robôs recebem dano e precisam ser reconstruídos. | Uma categoria de contenção, inspirada no papel dos quartéis, com visual de ficção científica. | Capacidade e vida limitadas; enxames passam e voadores ignoram. É a opção com maior custo de implementação/UI. |
| **Pulso disruptor/EMP** | Interrompe temporariamente a cura do Mender e a liberação de filhotes da Broodmother, sem reduzir o movimento. | Caminho exclusivo do Laser Array: dano contínuo ou interrupção de habilidades. | Exige atingir o inimigo certo; intervalo de efeito evita silenciar permanentemente um grupo. |

## Minha recomendação

Começar com **Projetor de espuma + Composto corrosivo**. O primeiro cria zonas no mapa; o segundo faz as armas cooperarem. Depois adicionar **EMP**, pois ele responde aos inimigos especiais que já existem. Se quiser freeze, oferecê-lo como evolução exclusiva da espuma: o jogador reconhece uma família de controle e toma uma escolha simples.

Arco elétrico pode vir quando fizer falta uma alternativa forte contra voadores/escudos. Sentinelas ficam para uma etapa maior, porque introduzem vida de aliados, bloqueio e reposição. São propostas com decisões diferentes, em vez de seis maneiras de aplicar o mesmo debuff.

A Machine Pistol continua sendo uma arma de tiros rápidos. Suppression é uma escolha de campo: base sem slow; primeiro rank de 25% por 0,7 s, segundo de 35% por 1,3 s, terceiro de 45% por 1,9 s. Isso não decide antecipadamente nenhuma proposta da tabela.
