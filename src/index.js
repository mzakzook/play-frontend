(function () {

  const BACKEND_URL = 'http://localhost:3000';

  let mainDiv = document.querySelector('[data-id="game-con"]')
  let chatWindow = document.querySelector('[data-id="chat-window"]')
  let chatList = chatWindow.querySelector('ul')
  let topNav = document.querySelector('.top-nav')
  let current_player = {}
  let gamesReference
  let playersReference
  let chatsReference
  let pgsReference

  const pongButton = document.createElement('button')
  pongButton.className = "game-button" 
  pongButton.textContent = "Ping Pong"

  const foosballButton = document.createElement('button')
  foosballButton.className = "game-button"
  foosballButton.textContent = "Foosball" 

  const shuffleboardButton = document.createElement('button')
  shuffleboardButton.className = "game-button" 
  shuffleboardButton.textContent = "Shuffleboard" 

  // const liveChatButton = document.createElement('button')
  // liveChatButton.className = "other-button" 
  // liveChatButton.textContent = "Live Chat" 

  // const leaderButton = document.createElement('button')
  // leaderButton.className = "other-button" 
  // leaderButton.textContent = "Leaderboard" 

  const topDiv = document.querySelector('.top')

  const signInForm = document.querySelector('.user-form')



  fetchGames()
  fetchPlayers()
  fetchPlayerGames()
  
  listenForGameSelection()
  listenForJoin()
  listenForSignIn()
  chatListener()
  // chatRefreshListener()
  
  function fetchGames() {
    fetch(`${BACKEND_URL}/games`)
    .then(response => 
      response.json())
    .then(data => {
      gamesReference = data
    })
  }

  function fetchPlayers() {
    fetch(`${BACKEND_URL}/players`)
  .then(response => 
    response.json())
  .then(data => {
    playersReference = data
  })
  }
  
  function fetchChats() {
    fetch(`${BACKEND_URL}/chats`)
    .then(response => 
      response.json())
    .then(data => {
      chatsReference = data
    })
    .then(data => chatList.innerHTML = "")
    .then(data => loadChats())
  }

  function fetchPlayerGames() {
    fetch(`${BACKEND_URL}/player_games`)
    .then(response => 
      response.json())
    .then(data => {
      pgsReference = data
    })
  }

  function fetchLeaders(gameType) {
    fetch(`${BACKEND_URL}/player_games?table_type=${gameType}`)
    .then(res => {
      fetchPlayers()
      return res.json()
    })
    .then(data => {
      const leaderboard = document.querySelector(".leaderboard")
      leaderboard.innerHTML = "<h2>Leaderboard</h2>"
      const leaderUl = document.createElement('ul')
      leaderboard.appendChild(leaderUl)
      const leaderNamesAndGamesPlayed = data.map(playerObj => `${playerObj[0]} Game(s) - ${playersReference.data.find(player => parseInt(player.id) === playerObj[1]).attributes.name}`)
      for (let i = 0; i < leaderNamesAndGamesPlayed.length ; i++) {
        leaderUl.innerHTML += `<li>${i + 1}.  ${leaderNamesAndGamesPlayed[i]}`
      }
    })
  }



  function ifSignedIn() {
    topDiv.append(pongButton, foosballButton, shuffleboardButton) 
    mainDiv.className = "post-sign-in"
    chatWindow.className = "chat"
    document.querySelector('.pre-all-con').className = "all-con"
    fetchChats()
    setInterval(function(){fetchChats()}, 1000)
    mainDiv.innerHTML = `
    <h1>Hey ${current_player.name}</h1>
    <h2>What do you want to Play?</h2>
    <h3>(Choose a Game Type Above)</h3>
    `
    

  }

  function loadChats() {
    // chatsReference.data[0].attributes.message
    // chatsReference.data[0].attributes.player.name
    chatsReference.data.forEach(chat => {
      let chatClass
      if (chat.attributes.player.name === current_player.name){
        chatClass = "my-chat"
        chatList.innerHTML += `<li class=${chatClass}>${chat.attributes.message} [${new Date(chat.attributes.created_at).toLocaleString('en-US').replace(/:\d{2}\s/,' ').bold()}]</li>`
      } else {
        chatClass = "their-chat"
        chatList.innerHTML += `<li class=${chatClass}>${chat.attributes.player.name.bold()} [${new Date(chat.attributes.created_at).toLocaleString('en-US').replace(/:\d{2}\s/,' ').bold()}]: ${chat.attributes.message}</li>`
      }
    })
  }

  function listenForSignIn() {
    signInForm.addEventListener('submit', event => {
      event.preventDefault()
      const userInput = event.target.username.value
      const existingUser = playersReference.data.find(player => player.attributes.name === userInput)
      if (existingUser) {
        current_player.id = existingUser.id
        current_player.name =  existingUser.attributes.name
        ifSignedIn()
      } else {
        fetch(`${BACKEND_URL}/players`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            name: userInput
          })
        })
        .then(res => res.json())
        .then(data => {
          current_player.id = data.id
          current_player.name = data.name
          ifSignedIn()
        })
      }
    })
  }




  function listenForGameSelection() {
    topDiv.addEventListener('click', event => {
      if (event.target.textContent === "Ping Pong" || event.target.textContent === "Shuffleboard" || event.target.textContent === "Foosball") {
        fetchGames()
        topNav.innerHTML = `<h1>Play on ${current_player.name}!</h1>`
        let game_type = event.target.textContent
        let games = gamesReference.data.filter(game => game.attributes.table.table_type === game_type && game.attributes.full === false)
        let first
        let second
        if (games[0].attributes.num_players === 2) {
          first = games[0] 
          second = games[1]
        } else {
          first = games[1]
          second = games[0]
        }
        const reservedGame = document.createElement('div')
        reservedGame.className = "reserved-games"
        reservedGame.innerHTML = `<h2>Recent ${event.target.textContent} Games</h2>`
        const matchedGames = gamesReference.data.filter(game => game.attributes.table.table_type === games[0].attributes.table.table_type && game.attributes.full === true) 
        reservedGame.innerHTML += `<ul>${matchedGames.reverse().map(game => renderFullGame(game)).join("")}</ul>`
        const gameOne = document.createElement('div')
        gameOne.className = "game-one"
        const gameTwo = document.createElement('div')
        gameTwo.className = "game-two"
        gameOne.innerHTML = renderGame(first)
        gameTwo.innerHTML = renderGame(second)
        mainDiv.innerHTML = `<h2>${games[0].attributes.table.table_type}</h2>`
        const leaderboard = document.createElement('div')
        leaderboard.className = "leaderboard"
        const slug = event.target.textContent.split(' ').join('_').toLowerCase()
        mainDiv.append(gameOne, gameTwo, reservedGame, leaderboard)
        fetchLeaders(slug)
      }
    })
  }

  function renderFullGame(game) {
    let liClass
    if (game.attributes.num_players == 2) {
      liClass = "one-v-one"
    } else {
      liClass = "two-v-two"
    }
    return `
    <li class=${liClass}>
      <h3> ${new Date(game.attributes.updated_at).toLocaleString('en-US').replace(/:\d{2}\s/,' ')} - ${game.attributes.num_players / 2} v ${game.attributes.num_players / 2} Game </h3>
      <ul> ${game.attributes.players.map(player => renderReservedPlayer(player)).join('')} </ul>
    </li>
    `

  }

  function renderReservedPlayer(player) {
    return `
      <li> ${player.name} </li>
    `
  }

  function renderGame(game) {
    let buttonText;
    let dataVal;
    if (game.attributes.players.find(player => player.name === current_player.name)) {
      const pgId = pgsReference.data.find(pg => pg.attributes.player.id === parseInt(current_player.id) && pg.attributes.game.id === parseInt(game.id))
      buttonText = " Leave "
      dataVal = pgId.id
    } else {
      buttonText = " Join "
      dataVal = game.id
    }
    return `<div class="game-div" data-id="game-div-${game.id}">
    <h4>${game.attributes.num_players / 2} v ${game.attributes.num_players / 2}</h4>
    <button data-id="${dataVal}">${buttonText}</button>
    <ul>${renderJoins(game.attributes.players, game.id)}</ul>
    </div>`
  }

  function renderJoins(join_array, game_id) {
    return join_array.map(player => {
      return `<li>${player.name}</li>`
    }).join('')
  }

  function listenForJoin() {
    mainDiv.addEventListener('click', event => {
      if (event.target.textContent === " Join ") {
        
        let chosenGame = gamesReference.data.find(game => {
          return game.id === event.target.dataset.id
        })
        if (chosenGame.attributes.players.length < chosenGame.attributes.num_players) {
          let playersUl = event.target.nextElementSibling
          let playersList = playersUl.querySelectorAll("li")
          let existingName = false
          for(let i = 0; i < playersList.length; i++) {
            if (playersList[i].textContent === current_player.name) {
              existingName = true
            }
          }
          // playersList.find(player => player.textContent === current_player.name)
          if (!existingName) {
            
            if (chosenGame.attributes.players.length === chosenGame.attributes.num_players - 1) {
          
              createPlayerGame(chosenGame, true)
              // need to build - updateFullValue(chosenGame)
              renderNewGame(chosenGame)
            } else {
              createPlayerGame(chosenGame, false)
            }
            
          }
        } else {
          alert("Game is full. Try again later.")
        }
      } else if (event.target.textContent === " Leave ") {
        deletePlayerGame(event.target)
      }
    })
  }

  function deletePlayerGame(leaveButton) {
    fetch(`${BACKEND_URL}/player_games/${leaveButton.dataset.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
    })
    .then(res => {
      const playersUl = leaveButton.nextElementSibling
      const playersListItems = playersUl.querySelectorAll('li')
      for(let i = 0; i < playersListItems.length; i++) {
        if (playersListItems[i].textContent === current_player.name) {
          playersListItems[i].remove()
          leaveButton.textContent = " Join "
          leaveButton.dataset.id = leaveButton.parentElement.dataset.id.split('-')[2]
          fetchGames()
        }
      }

    })
  }

  function renderNewGame(game) {
    fetch(`${BACKEND_URL}/games`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        table_id: game.attributes.table.id,
        num_players: game.attributes.num_players,
        full: false
      })
    })
    .then(res => res.json())
    .then(data => {
      fetchGames()
      const replacedGame = document.querySelector(`[data-id="game-div-${game.id}"]`)
      setTimeout(function(){
        updateFull(game.id)
        // replacedGame.dataset.id.split('-')[2]
        replacedGame.dataset.id = `game-div-${data.id}`
        replacedGame.querySelector('ul').innerHTML = ""
        replacedGame.querySelector('button').textContent = " Join "
        replacedGame.querySelector('button').dataset.id = data.id
      }, 3000)
      
    })
  }

  function updateFull(id) {
    fetch(`${BACKEND_URL}/games/${id}`, {
      method: 'PATCH',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        full: true
      })
    })
  }

  function createPlayerGame(chosenGame, boolean) {
    fetch(`${BACKEND_URL}/player_games`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        game_id: chosenGame.id,
        player_id: current_player.id
      })
    })
    .then(response => response.json())
    .then(pg => {
      const gameChoice = document.querySelector(`[data-id="game-div-${pg.data.attributes.game.id}"]`)
      const ul = gameChoice.querySelector('ul')
      const gameButton = gameChoice.querySelector('button')
      if (boolean) {
        gameButton.textContent = " Game in Session "
        setTimeout(function(){alert("Ready to Play!")}, 1000)
      } else {
        gameButton.textContent = " Leave "
      }
      gameButton.dataset.id = pg.data.id
      ul.innerHTML += renderJoins([pg.data.attributes.player])
      fetchGames()
    })
  }
  
  function chatListener() {
    chatForm = chatWindow.querySelector('form')
    chatForm.addEventListener('submit', function(event) {
      event.preventDefault()
      const message = event.target.message.value
      fetch(`${BACKEND_URL}/chats`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          message: message,
          player_id: current_player.id
        })
      })
      .then(res => res.json())
      .then(data => {
  
        chatList.innerHTML += `<li class="my-chat">${data.message} [${new Date().toLocaleString('en-US').replace(/:\d{2}\s/,' ').bold()}]</li>`
        
      })
      event.target.message.value = ""
    })
  }

  // function chatRefreshListener() {
  //   chatWindow.addEventListener('click', event => {
  //     if (event.target.tagName === "BUTTON" && event.target.textContent === "Refresh") {
  //       chatList.innerHTML = ""
  //       fetchChats()
  //     }
  //   })
  // }



})();

