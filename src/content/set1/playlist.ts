import { Question, Video } from "types/types";

const playlist: Array<Video | Question> = [
  { type: "video", src: "media/eduplay/videos/p1.mp4", duration: 56 },
  {
    type: "question",
    id: 1,
    text: "A paisagem dos Lençóis Maranhenses ____ cheia de dunas e lagoas cristalinas, um cenário incrível! Qual a forma correta de completar essa frase?",
    options: ["estar", "está", "estár", "esta"],
    correctAnswer: 1,
    duration: 20,
  },
  { type: "video", src: "media/eduplay/videos/p2.mp4", duration: 82 },
  {
    type: "question",
    id: 2,
    text: "Os Lençóis Maranhenses são lindos, _____ é importante ir na época certa para ver as lagoas cheias.",
    options: ["mais", "mas", "maís", "más"],
    correctAnswer: 1,
    duration: 20,
  },
  { type: "video", src: "media/eduplay/videos/p3.mp4", duration: 78},
  {
    type: "question",
    id: 3,
    text: "Assinale a frase com o uso correto de 'estada' ou 'estadia'.",
    options: [
      "A nossa estada nos Lençóis Maranhenses foi curta, mas inesquecível.",
      "A agência organizou nossa estada no hotel à beira das lagoas.",
      "Durante a estadia no parque, fizemos trilhas e visitamos as dunas.",
      "A estada no parque e a estada no hotel são o mesmo tipo de viagem.",
    ],
    correctAnswer: 0,
    duration: 25,
  },
  {type: "video", src: "media/eduplay/videos/outro.mp4", duration: 40},
];

export default playlist;
