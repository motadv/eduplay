// quiz-logic-server/server.ts
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import playlist from "./content/set1/playlist";
import { Room } from "types/types";

const app = express();
const httpServer = createServer(app);
const _PORT = 8082;

const io = new SocketIOServer(httpServer, {
  cors: { origin: ["http://localhost:8081", "http://192.168.1.23:8081", "http://192.168.1.21:8081", "http://192.168.0.148:8081", "http://10.100.20.70:8081"] },
});

const introVideo = {
  src: 'media/eduplay/videos/intro.mp4',
  qrCodeDelay: 40, // Tempo em segundos antes de exibir o QR Code
  qrCodeDuration: 20 // Tempo em segundos que o QR Code ficará visível
}

const INTRO_TOTAL_DURATION = introVideo.qrCodeDelay + introVideo.qrCodeDuration;

const rooms: { [roomId: string]: Room } = {};

function startNextStepInPlaylist(roomId: string, io: SocketIOServer) {
  const room = rooms[roomId];
  if (!room) return;

  const currentStep = playlist[room.playlistIndex];

  if (!currentStep) {
    console.log(`[FIM DE JOGO] Playlist terminada na sala ${roomId}.`);
    io.to(roomId).emit("quizEnded", "Obrigado por jogar!");
    // Limpa a sala da memória após o fim do jogo
    delete rooms[roomId];
    return;
  }

  console.log(`[PLAYLIST] Iniciando etapa ${room.playlistIndex} (${currentStep.type}) na sala ${roomId}`);

  if (currentStep.type === "video") {
    room.state = "video";
    io.to(roomId).emit("playVideo", { url: currentStep.src, duration: currentStep.duration });
    setTimeout(() => startNextStepInPlaylist(roomId, io), currentStep.duration * 1000);
  } else if (currentStep.type === "question") {
    room.state = "question";
    room.currentQuestion = currentStep; // Armazena a pergunta atual para validação
    
    // Prepara o objeto de resultados para a nova pergunta
    room.results = {};
    currentStep.options?.forEach((opt: any, index: number) => {
        const letter = String.fromCharCode(65 + index);
        room.results[letter] = 0;
    });

    // Reseta a resposta de cada jogador para 'null' antes da nova pergunta.
    if (room.players && room.players.length > 0) {
      room.players.forEach((player: any) => {
        player.isCorrect = null;
        player.answer = null;
      });
    }

    // Envia a pergunta completa para o Apresentador
    if (room.presenterId) {
      io.to(room.presenterId).emit("quiz:newQuestion", currentStep);
    }
    // Envia apenas as opções para os Jogadores (broadcast para a sala, o apresentador pode ignorar)
    io.to(roomId).emit("quiz:showAnswerOptions", currentStep);
    
    // Timer para o fim da pergunta
    setTimeout(() => {
      if (rooms[roomId] && rooms[roomId].state === "question") {
        room.state = "results";

        const stats = {
          correct: 0,
          incorrect: 0
        };

        room.players.forEach((player: any) => {
          if (player.isCorrect === true) {
            stats.correct++;
          } else if (player.isCorrect === false) {
            stats.incorrect++;
          }
        });

        // Envia os resultados finais e a resposta correta para todos
        io.to(roomId).emit("quiz:endQuestion", {
          results: room.results,
          correctAnswerIndex: currentStep.correctAnswer,
          stats: stats,
        });

        // Pausa de 5 segundos para ver os resultados antes da próxima etapa
        setTimeout(() => startNextStepInPlaylist(roomId, io), 5000);
      }
    }, currentStep.duration * 1000);
  }

  room.playlistIndex++;
}

io.on("connection", (socket: Socket) => {
  console.log(`Cliente conectado via WebSocket: ${socket.id}`);

  // --- LÓGICA DE ENTRADA NA SALA UNIFICADA E CORRIGIDA ---
  socket.on("joinRoom", ({ roomId, isPresenter }: { roomId: string, isPresenter: boolean }) => {
    socket.join(roomId);

    if (isPresenter) {
      if (!rooms[roomId]) {
        rooms[roomId] = {
          id: roomId,
          state: "waiting",
          presenterId: socket.id,
          players: [],
          playlistIndex: 0,
          results: {},
          currentQuestion: null,
        };
        console.log(`[SALA CRIADA] Sala ${roomId} criada por ${socket.id}.`);
        socket.emit("roomCreated", `Sala ${roomId} criada com sucesso.`);
        socket.emit("playIntroVideo", introVideo);

        setTimeout(() => {
          console.log(`[QUIZ START] Introdução finalizada na sala ${roomId}.`);
          startNextStepInPlaylist(roomId, io);
        }, INTRO_TOTAL_DURATION * 1000);
      }
      return;
    }

    // Lógica para entrada do Jogador
    if (!rooms[roomId]) {
      socket.emit("error", `Sala ${roomId} não existe.`);
      return;
    }
    
    const room = rooms[roomId];
    if (!room.players.find((p: any) => p.id === socket.id)) {
      room.players.push({ id: socket.id, answer: null, isCorrect: null });
    }
    console.log(`[JOGADOR ENTROU] Jogador ${socket.id} na sala ${roomId}. Total: ${room.players.length}`);
    socket.emit("joined", `Você entrou na sala: ${roomId}`);
  });

  // --- NOVO HANDLER PARA RECEBER RESPOSTAS ---
  socket.on('player:submitAnswer', ({ roomId, answerIndex }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'question' || !room.currentQuestion) return;

    // Impede votos duplicados
    const player = room.players.find((p: any) => p.id === socket.id);
    if (player && player.answer !== null) return;
    
    player.answer = answerIndex;

    const isCorrect = (room.currentQuestion.correctAnswer === answerIndex);
    player.isCorrect = isCorrect;

    socket.emit('quiz:feedback', { correct: isCorrect });

    const answerLetter = String.fromCharCode(65 + answerIndex);
    if (room.results[answerLetter] !== undefined) {
      room.results[answerLetter]++;
    }

    if (room.presenterId) {
      io.to(room.presenterId).emit('quiz:updateResults', room.results);
    }
    console.log(`[RESPOSTA] Sala ${roomId} | Jogador ${socket.id} respondeu ${answerLetter}. Correto: ${isCorrect}`);
  });

  socket.on("disconnect", () => {
    console.log(`[DESCONEXÃO] Cliente desconectado: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.presenterId === socket.id) {
        console.log(`[APRESENTADOR SAIU] Sala ${roomId} será fechada.`);
        io.to(roomId).emit('error', 'O apresentador se desconectou. O quiz foi encerrado.');
        delete rooms[roomId];
        break;
      }

      const playerIndex = room.players.findIndex((p: any) => p.id === socket.id);
      if (playerIndex > -1) {
        room.players.splice(playerIndex, 1);
        console.log(`[JOGADOR SAIU] Jogador ${socket.id} removido da sala ${roomId}. Total: ${room.players.length}`);
        break;
      }
    }
  });
});

httpServer.listen(_PORT, () => {
  console.log(`EduPlay Logic Server está rodando em http://localhost:${_PORT}`);
});