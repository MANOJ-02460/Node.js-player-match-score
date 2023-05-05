const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
  }
};
initializeDbAndServer();

const convertPlayerDetailsTableDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsTableDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API 1 //

app.get("/players/", async (request, response) => {
  const getPlayersDetails = `
        SELECT
            *
        FROM
            player_details;`;
  const playerArray = await database.all(getPlayersDetails);
  response.send(
    playerArray.map((eachPlayer) =>
      convertPlayerDetailsTableDbObjectToResponseObject(eachPlayer)
    )
  );
});

// API 2 //

app.get(`/players/:playerId/`, async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdDetails = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};`;
  const playerIdArray = await database.get(getPlayerIdDetails);
  response.send(
    convertPlayerDetailsTableDbObjectToResponseObject(playerIdArray)
  );
});

// API 3 //

app.put(`/players/:playerId/`, async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerTable = `
        UPDATE
            player_details
        SET
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};`;
  await database.run(updatePlayerTable);
  response.send("Player Details Updated");
});

// API 4 //

app.get(`/matches/:matchId/`, async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
        SELECT
            *
        FROM 
            match_details
        WHERE
            match_id = ${matchId};`;
  const matchArray = await database.get(getMatchDetails);
  response.send(convertMatchDetailsTableDbObjectToResponseObject(matchArray));
});

// API 5 //

app.get(`/players/:playerId/matches`, async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
        SELECT
            *
        FROM player_match_score
        NATURAL JOIN match_details
        WHERE
            player_id = ${playerId};`;
  const playerMatch = await database.all(getPlayerMatchQuery);
  response.send(
    playerMatch.map((eachMatch) =>
      convertMatchDetailsTableDbObjectToResponseObject(eachMatch)
    )
  );
});

// API 6 //

app.get(`/matches/:matchId/players`, async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
        SELECT
            *
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE
            match_id = ${matchId};`;
  const playerArray = await database.all(getMatchPlayersQuery);
  response.send(
    playerArray.map((eachPlayer) =>
      convertPlayerDetailsTableDbObjectToResponseObject(eachPlayer)
    )
  );
});

// API 7 //

app.get(`/players/:playerId/playerScores`, async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
        SELECT
            player_id AS playerId,
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM 
            player_match_score
        NATURAL JOIN player_details
        WHERE
            player_id = ${playerId};`;
  const playerMatchDetails = await database.get(getMatchPlayerQuery);
  response.send(playerMatchDetails);
});
module.exports = app;
