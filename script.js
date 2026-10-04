let teams = JSON.parse(localStorage.getItem('teams')) || [];
let previewDraft = [];
let draggedPlayer = null;
const teamColors = ['#FF5722','#4CAF50','#2196F3','#9C27B0','#FFC107','#E91E63','#00BCD4','#FF9800','#3F51B5','#009688'];
let teamScoreHistory = {};
let playerScores = {};
let teamChart = null;
let topPlayersChart = null;

// --- Helper Functions ---
function saveData() { localStorage.setItem('teams', JSON.stringify(teams)); }
function getRandomAvatar(){ const avatarId = Math.floor(Math.random()*70)+1; return `https://i.pravatar.cc/50?img=${avatarId}`; }

// --- Add Team ---
function addTeam(){
  const teamName = document.getElementById('teamName').value.trim();
  if(!teamName) return alert('Enter a team name.');
  if(teams.some(t => t.name.toLowerCase()===teamName.toLowerCase())) return alert('Team exists!');
  teams.push({ name:teamName, players:[], color: teamColors[teams.length % teamColors.length] });
  document.getElementById('teamName').value='';
  updateTeamSelect(); updateSimulatorSelects(); updateManualMatchSelects();
  displayTeams(); saveData();
}

// --- Add Player with Photo ---
function addPlayer(){
  const teamName = document.getElementById('teamSelect').value;
  const playerName = document.getElementById('playerName').value.trim();
  const fileInput = document.getElementById('playerAvatar');

  if(!teamName) return alert('Select a team.');
  if(!playerName) return alert('Enter a player name.');

  const team = teams.find(t => t.name === teamName);

  if(fileInput.files && fileInput.files[0]){
    const reader = new FileReader();
    reader.onload = function(e){
      team.players.push({ name: playerName, notes: '', avatar: e.target.result });
      document.getElementById('playerName').value=''; fileInput.value='';
      displayTeams(); saveData();
    }
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    team.players.push({ name: playerName, notes: '', avatar: getRandomAvatar() });
    document.getElementById('playerName').value='';
    displayTeams(); saveData();
  }
}

// --- Edit / Delete Players ---
function editPlayer(teamIndex, playerIndex){
  const player=teams[teamIndex].players[playerIndex];
  const newName=prompt("Edit player name:",player.name);
  if(newName && newName.trim()!=='') player.name=newName.trim();
  const newNotes=prompt("Edit player notes:",player.notes);
  if(newNotes!==null) player.notes=newNotes.trim();
  displayTeams(); saveData();
}

function deletePlayer(teamIndex, playerIndex){ 
  if(confirm('Delete player?')) { teams[teamIndex].players.splice(playerIndex,1); displayTeams(); saveData(); } 
}
function deleteTeam(teamIndex){ 
  if(confirm('Delete team?')) { teams.splice(teamIndex,1); updateTeamSelect(); updateSimulatorSelects(); updateManualMatchSelects(); displayTeams(); saveData(); } 
}

// --- Display Teams ---
function displayTeams(){
  const teamList = document.getElementById('teamList');
  teamList.innerHTML='';
  teams.forEach((team,teamIndex)=>{
    const div = document.createElement('div'); div.className='team'; div.style.borderColor=team.color;
    div.innerHTML=`
      <div class="team-header"><h3>${team.name}</h3><button onclick="deleteTeam(${teamIndex})">Delete Team</button></div>
      <div class="player-list">
        ${team.players.map((p,playerIndex)=>`
          <div class="player" draggable="true">
            <span><span class="player-avatar" style="background-image:url('${p.avatar}')"></span>${p.name}${p.notes?` - (${p.notes})`:''}</span>
            <div class="actions">
              <button class="edit" onclick="editPlayer(${teamIndex},${playerIndex})">Edit</button>
              <button onclick="deletePlayer(${teamIndex},${playerIndex})">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>`;
    teamList.appendChild(div);
  });
  enableDragAndDrop();
}

// --- Search & Sort ---
function searchPlayer(){
  const search=document.getElementById('searchPlayer').value.toLowerCase();
  document.querySelectorAll('.player').forEach(p=>{
    p.classList.remove('highlight');
    if(p.innerText.toLowerCase().includes(search)) p.classList.add('highlight');
  });
}

function sortTeams(){ 
  teams.sort((a,b)=>a.name.localeCompare(b.name)); 
  displayTeams(); 
  updateTeamSelect(); 
  updateSimulatorSelects(); 
  updateManualMatchSelects(); 
  saveData(); 
}
function sortPlayers(){ 
  teams.forEach(t=>t.players.sort((a,b)=>a.name.localeCompare(b.name))); 
  displayTeams(); 
  saveData(); 
}

// --- Team Select Update ---
function updateTeamSelect(){
  const select = document.getElementById('teamSelect');
  select.innerHTML='<option value="">Select Team</option>';
  teams.forEach(t=>{ const option=document.createElement('option'); option.value=t.name; option.textContent=t.name; select.appendChild(option); });
}
function updateSimulatorSelects(){
  const sim1=document.getElementById('simTeam1'); const sim2=document.getElementById('simTeam2');
  [sim1,sim2].forEach(select=>{ select.innerHTML='<option value="">Select Team</option>'; teams.forEach(t=>{ const option=document.createElement('option'); option.value=t.name; option.textContent=t.name; select.appendChild(option); }); });
}
function updateManualMatchSelects(){
  const manual1 = document.getElementById('manualTeam1');
  const manual2 = document.getElementById('manualTeam2');
  [manual1, manual2].forEach(select=>{
    select.innerHTML='<option value="">Select Team</option>';
    teams.forEach(t=>{ const option=document.createElement('option'); option.value=t.name; option.textContent=t.name; select.appendChild(option); });
  });
}

// --- Drag & Drop Players ---
function enableDragAndDrop(){
  document.querySelectorAll('.player').forEach(playerDiv=>{
    playerDiv.addEventListener('dragstart',e=>{ draggedPlayer=e.currentTarget; e.currentTarget.style.opacity='0.5'; });
    playerDiv.addEventListener('dragend',e=>{ draggedPlayer.style.opacity='1'; draggedPlayer=null; });
    playerDiv.addEventListener('dragover',e=>e.preventDefault());
    playerDiv.addEventListener('drop',e=>{
      e.preventDefault();
      if(!draggedPlayer||draggedPlayer===e.currentTarget) return;
      const teamDiv=e.currentTarget.closest('.team');
      const teamIndex=Array.from(document.getElementById('teamList').children).indexOf(teamDiv);
      const playerList=teams[teamIndex].players;
      const draggedIndex=Array.from(teamDiv.querySelectorAll('.player')).indexOf(draggedPlayer);
      const targetIndex=Array.from(teamDiv.querySelectorAll('.player')).indexOf(e.currentTarget);
      const temp=playerList[draggedIndex]; playerList.splice(draggedIndex,1); playerList.splice(targetIndex,0,temp);
      displayTeams(); saveData();
    });
  });
}

// --- Draft Preview ---
function draftPlayersPreview(){
  previewDraft = JSON.parse(JSON.stringify(teams));
  const previewDiv=document.getElementById('previewList');
  previewDiv.innerHTML='';
  previewDraft.forEach(team=>{
    const teamDiv=document.createElement('div'); teamDiv.className='preview-team'; teamDiv.style.borderColor=team.color;
    teamDiv.innerHTML=`<h4>${team.name}</h4>${team.players.map(p=>`<div class="preview-player"><span class="player-avatar" style="background-image:url('${p.avatar}')"></span>${p.name}${p.notes?` (${p.notes})`:''}</div>`).join('')}`;
    previewDiv.appendChild(teamDiv);
  });
  document.getElementById('draftPreview').style.display='flex';
}
function confirmDraft(){ teams.forEach((team,i)=>{ team.players=[...previewDraft[i].players]; }); displayTeams(); saveData(); closePreview(); alert("Draft applied!"); }
function closePreview(){ document.getElementById('draftPreview').style.display='none'; }
function resetDraft(){ if(confirm("Reset drafts?")){ teams=JSON.parse(localStorage.getItem('teams'))||[]; updateTeamSelect(); displayTeams(); updateSimulatorSelects(); updateManualMatchSelects(); alert("Teams restored!"); } }

// --- CSV Export/Import ---
function exportCSV(){
  if(teams.length===0) return alert("No teams!");
  let csvContent="Team,Player,Notes\n";
  teams.forEach(team=>{
    if(team.players.length===0){ csvContent+=`${team.name},,\n`; } 
    else { team.players.forEach(p=>{ csvContent+=`${team.name},${p.name},${p.notes}\n`; }); }
  });
  const encodedUri=encodeURI("data:text/csv;charset=utf-8,"+csvContent);
  const link=document.createElement("a");
  const now=new Date(); link.setAttribute("href",encodedUri); link.setAttribute("download",`teams_export_${now.toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function importCSV(){
  const fileInput=document.getElementById('csvFile'); const file=fileInput.files[0]; if(!file) return alert("Select a CSV file!");
  const reader=new FileReader();
  reader.onload=function(e){
    const lines=e.target.result.split(/\r?\n/).filter(l=>l.trim()!==''); const importedTeams={};
    lines.forEach((line,index)=>{ if(index===0 && line.toLowerCase().startsWith("team,player")) return; const [teamName,playerName,notes]=line.split(',').map(s=>s.trim()); if(!importedTeams[teamName]) importedTeams[teamName]={name:teamName,players:[],color:teamColors[Object.keys(importedTeams).length % teamColors.length]}; if(playerName) importedTeams[teamName].players.push({name:playerName,notes:notes||'',avatar:getRandomAvatar()}); });
    teams=Object.values(importedTeams); updateTeamSelect(); displayTeams(); updateSimulatorSelects(); updateManualMatchSelects(); saveData(); alert("Teams imported!"); 
  }
  reader.readAsText(file);
}

// --- Match Simulator ---
function simulateMatch(){
  const t1=document.getElementById('simTeam1').value;
  const t2=document.getElementById('simTeam2').value;
  if(!t1||!t2) return alert("Select both teams!");
  if(t1===t2) return alert("Teams must be different!");
  const team1=teams.find(t=>t.name===t1); const team2=teams.find(t=>t.name===t2);
  const score1=Math.floor(Math.random()*5); const score2=Math.floor(Math.random()*5);
  recordMatch(team1.name,team2.name,score1,score2,team1.players.concat(team2.players).map(p=>({name:p.name,points:Math.floor(Math.random()*5)})));
  displayMatchResult(`${team1.name} ${score1} - ${score2} ${team2.name}`);
  displayTeams(); updateCharts();
}

function addManualMatch(){
  const t1=document.getElementById('manualTeam1').value;
  const t2=document.getElementById('manualTeam2').value;
  const s1=parseInt(document.getElementById('manualScore1').value);
  const s2=parseInt(document.getElementById('manualScore2').value);
  if(!t1||!t2||isNaN(s1)||isNaN(s2)) return alert("Fill all fields!");
  if(t1===t2) return alert("Teams must be different!");
  const performance=document.getElementById('manualPlayerPerformance').value.trim().split('\n').map(line=>{ const [name,points]=line.split(':'); return {name:name.trim(),points:parseInt(points)}; });
  recordMatch(t1,t2,s1,s2,performance);
  alert("Match added!"); displayMatchHistory(); updateCharts();
}

let matchHistory = JSON.parse(localStorage.getItem('matchHistory')) || [];
function recordMatch(team1,team2,score1,score2,playerPerformances){
  matchHistory.push({team1,team2,score1,score2,playerPerformances,date:new Date().toLocaleString()});
  localStorage.setItem('matchHistory',JSON.stringify(matchHistory));
  playerPerformances.forEach(p=>{ playerScores[p.name]=(playerScores[p.name]||0)+p.points; });
  teamScoreHistory[team1]=(teamScoreHistory[team1]||0)+score1;
  teamScoreHistory[team2]=(teamScoreHistory[team2]||0)+score2;
  displayMatchHistory();
}

function displayMatchResult(result){ document.getElementById('matchResult').innerText=result; setTimeout(()=>document.getElementById('matchResult').innerText='',5000); }
function displayMatchHistory(){
  const histDiv=document.getElementById('matchHistory');
  histDiv.innerHTML='';
  matchHistory.slice().reverse().forEach(m=>{ const div=document.createElement('div'); div.textContent=`${m.date}: ${m.team1} ${m.score1} - ${m.score2} ${m.team2}`; histDiv.appendChild(div); });
}

// --- Charts ---
function updateCharts(){
  const ctx1=document.getElementById('teamChart').getContext('2d');
  if(teamChart) teamChart.destroy();
  teamChart=new Chart(ctx1,{type:'bar',data:{labels:Object.keys(teamScoreHistory),datasets:[{label:'Total Team Scores',data:Object.values(teamScoreHistory),backgroundColor:'#4CAF50'}]},options:{responsive:true,plugins:{legend:{display:false}}}});
  
  const topPlayers=Object.entries(playerScores).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const ctx2=document.getElementById('topPlayersChart').getContext('2d');
  if(topPlayersChart) topPlayersChart.destroy();
  topPlayersChart=new Chart(ctx2,{type:'bar',data:{labels:topPlayers.map(p=>p[0]),datasets:[{label:'Player Points',data:topPlayers.map(p=>p[1]),backgroundColor:'#FFC107'}]},options:{responsive:true,plugins:{legend:{display:false}}}});
}

// --- Initialize ---
updateTeamSelect(); displayTeams(); updateSimulatorSelects(); updateManualMatchSelects();
displayMatchHistory();
