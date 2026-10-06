---
titulo: Como o rádio funciona
tema: radio
tipo: guia
resumo: Frequência, faixas, por que um rádio alcança longe e outro não, e o que é uma repetidora. A base para entender todo o resto.
palavras-chave:
  - rádio
  - radio
  - frequência
  - onda
  - VHF
  - UHF
  - HF
  - alcance
  - antena
  - repetidora
  - propagação
  - modulação
  - FM
  - AM
veja-tambem:
  - radio/radios-sem-licenca
revisao:
  revisado: false
  por: ""
autores:
  - André Pavini
atualizado: 2026-10-06
fontes:
  - doc: anatel-cartilha-radioamador-2026
    pagina: 29
    sobre: frequência, comprimento de onda e designação das faixas
  - doc: anatel-cartilha-radioamador-2026
    pagina: 30
    sobre: faixas VHF e UHF; mensagem, portadora e modulação AM e SSB
  - doc: anatel-cartilha-radioamador-2026
    pagina: 31
    sobre: FM em VHF/UHF e CW
  - doc: anatel-cartilha-radioamador-2026
    pagina: 32
    sobre: ondas terrestres e espaciais, ionosfera e mecanismo de cada faixa
  - doc: anatel-cartilha-radioamador-2026
    pagina: 33
    sobre: HF varia com hora, estação e ciclo solar; como melhorar a recepção
  - doc: anatel-cartilha-radioamador-2026
    pagina: 34
    sobre: operar com a menor potência necessária
  - doc: anatel-cartilha-radioamador-2026
    pagina: 26
    sobre: transceptor e repetidoras em VHF/UHF
  - doc: anatel-cartilha-radioamador-2026
    pagina: 27
    sobre: tempo da repetidora e operação com deslocamento (shift)
---

## O que é uma onda de rádio

O rádio transmite a sua voz pelo ar usando uma onda invisível. Essa onda se repete muitas vezes por segundo. O número de repetições por segundo é a frequência, medida em hertz (Hz). Um megahertz (MHz) é um milhão de repetições por segundo.

Cada onda também tem um comprimento: a distância que ela percorre em uma repetição. Quanto maior a frequência, menor a onda. Uma conta prática: comprimento em metros ≈ 300 ÷ frequência em MHz. Por isso se fala em "faixa de 2 metros" para perto de 146 MHz.

> [!ATENCAO]
> Para conversar, os dois rádios precisam estar na mesma frequência. É como combinar o mesmo canal.

## As faixas de frequência

As frequências são divididas em faixas com nomes. Cada faixa se comporta de um jeito, e isso decide até onde a sua voz chega.

**Faixas mais usadas em comunicação por rádio**

| Faixa | Frequências | Como a onda viaja | Uso típico |
|---|---|---|---|
| MF | 0,3 a 3 MHz | Rente ao chão, acompanhando a curva da Terra | Alcance moderado |
| HF | 3 a 30 MHz | Rebate no alto da atmosfera (ionosfera) e volta | Longas distâncias, outros estados e países |
| VHF | 30 a 300 MHz | Em linha reta entre as antenas | Uso local e regional, repetidoras |
| UHF | 300 a 3.000 MHz | Em linha reta entre as antenas | Uso local, rádios portáteis, repetidoras |

*Valores aproximados, da Cartilha do Serviço Radioamador da Anatel.*

## Por que um rádio alcança longe e outro não

Em VHF e UHF, a onda vai praticamente em linha reta de uma antena até a outra. Morro, prédio e a própria curva da Terra bloqueiam o sinal. Por isso a altura da antena faz tanta diferença: quanto mais alto, mais longe ela "enxerga".

Em HF, a onda sobe, rebate na ionosfera (uma camada de 60 a 400 km de altura) e volta para a Terra muito longe, às vezes em vários saltos, alcançando milhares de quilômetros. Só que isso muda com a hora do dia, a estação do ano e o ciclo do Sol: uma frequência que funciona de manhã pode não funcionar à noite.

- Antena boa e bem instalada ajuda mais do que aumentar a potência.
- Use a menor potência que mantenha a conversa: gasta menos bateria e atrapalha menos os outros.
- Cabos e conectores em bom estado evitam perder sinal no caminho.
- Aparelhos eletrônicos, lâmpadas e fontes com defeito geram ruído que atrapalha a recepção.

## Como a voz vai dentro da onda (modulação)

O transmissor gera uma onda firme, chamada portadora, e "imprime" a sua voz nela. A Anatel compara: a voz é a carta, a portadora é o envelope com endereço, e o sinal transmitido é o envelope postado. Os jeitos mais comuns de imprimir a voz:

- FM (frequência modulada): o mais usado em VHF e UHF, nos rádios portáteis e nas repetidoras.
- AM (amplitude modulada): a força da onda varia com a voz.
- SSB (faixa lateral única): uma variação do AM muito usada em HF para longas distâncias.
- CW (telegrafia): a onda liga e desliga em pontos e traços, o código Morse.

> [!ATENCAO]
> Dois rádios na mesma frequência mas em modos diferentes (um em FM, outro em AM) não se entendem direito.

## Simplex e repetidora

No modo simplex, os dois rádios falam e escutam na mesma frequência, direto um com o outro. É simples, mas o alcance depende de os dois se "enxergarem".

Uma repetidora é uma estação instalada num lugar alto que escuta numa frequência (a entrada) e retransmite na hora em outra (a saída). Assim, dois rádios que não se alcançariam conseguem conversar pela repetidora. No rádio, você ajusta a frequência de recepção e o deslocamento (em inglês, "shift") até a frequência em que transmite.

- Escute antes de falar: pode haver uma conversa ou uma emergência em andamento.
- Fale pouco e deixe pausas: a repetidora tem tempo máximo de transmissão e outros podem precisar dela.
- Repetidoras de radioamador são para radioamadores licenciados (veja a aula sobre a licença).
