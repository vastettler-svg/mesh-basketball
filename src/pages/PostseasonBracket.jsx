import {useEffect,useMemo,useRef,useState} from "react";
import {Maximize2,Minus,Plus} from "lucide-react";
import {useNavigate} from "react-router-dom";
import "../styles/postseasonBracket.css";
import accBadge from "../assets/conference-badges/acc.png";
import americanBadge from "../assets/conference-badges/american.png";
import big12Badge from "../assets/conference-badges/big-12.png";
import bigEastBadge from "../assets/conference-badges/big-east.png";
import bigTenBadge from "../assets/conference-badges/big-ten.png";
import cusaBadge from "../assets/conference-badges/c-usa.png";
import coastalBadge from "../assets/conference-badges/coastal.png";
import ivyBadge from "../assets/conference-badges/ivy.png";
import macBadge from "../assets/conference-badges/mac.png";
import mountainWestBadge from "../assets/conference-badges/mountain-west.png";
import ovcBadge from "../assets/conference-badges/ovc.png";
import secBadge from "../assets/conference-badges/sec.png";
import sunBeltBadge from "../assets/conference-badges/sun-belt.png";
import westCoastBadge from "../assets/conference-badges/west-coast.png";
const CONFERENCE_BADGES={"ACC":accBadge,"American":americanBadge,"AAC":americanBadge,"Big 12":big12Badge,"Big East":bigEastBadge,"Big Ten":bigTenBadge,"C-USA":cusaBadge,"Conf USA":cusaBadge,"Conf-USA":cusaBadge,"Conference USA":cusaBadge,"Conference-USA":cusaBadge,"CAA":coastalBadge,"Coastal":coastalBadge,"Ivy":ivyBadge,"MAC":macBadge,"MWC":mountainWestBadge,"Mountain West":mountainWestBadge,"Mtn West":mountainWestBadge,"Mtn. West":mountainWestBadge,"OVC":ovcBadge,"SEC":secBadge,"SBC":sunBeltBadge,"Sun Belt":sunBeltBadge,"WCC":westCoastBadge,"West Coast":westCoastBadge};
const CONFERENCE_LABELS={"American":"AAC","Conf USA":"Conf USA","Conference USA":"Conf USA","CAA":"Coastal","MWC":"Mountain West","SBC":"Sun Belt","WCC":"West Coast","Ivy":"Ivy League"};

const W=1840,H=1440;
const REGIONS=[{name:"West",x:20,y:55,side:"left"},{name:"Midwest",x:20,y:910,side:"left"},{name:"East",x:1020,y:55,side:"right"},{name:"South",x:1020,y:910,side:"right"}];
const SEEDS=[1,16,8,9,5,12,4,13,6,11,3,14,7,10,2,15];
const NIT_SEEDS=[1,8,4,5,3,6,2,7];
const CROWN_LEFT=[1,32,16,17,8,25,9,24,5,28,12,21,4,29,13,20];
const CROWN_RIGHT=[2,31,15,18,7,26,10,23,6,27,11,22,3,30,14,19];

// Keep the school label compact; full team names remain available in Game Center.
const MASCOTS=["Horned Frogs","Bearkats","Great Danes","Ragin Cajuns","Warhawks","Wolfpack","Boilermakers","Braves","Green Wave","Buckeyes","Skyhawks","Monarchs","Blue Jays","Cyclones","Beavers","Dragons","Golden Eagles","Rainbow Warriors","Crimson Tide","Mean Green","Blue Hens","Blue Hose","Blue Raiders","Golden Hurricane","Golden Gophers","Redhawks","Red Wolves","Redbirds","Fighting Irish","Yellow Jackets","Golden Bears","Golden Flashes","Nittany Lions","Thundering Herd","Screaming Eagles","Purple Aces","Sea Wolves","Seawolves","Roadrunners","Chanticleers","Mountaineers","Commodores","Cavaliers","Wildcats","Bulldogs","Tigers","Dukes","Rams","Huskies","Hawkeyes","Wolverines","Aggies","Buffaloes","Falcons","Cardinals","Pirates","Cougars","Hoosiers","Broncos","Rebels","Gators","Eagles","Owls","Bison","Bears","Panthers","Bobcats","Redhawks","RedHawks","Spartans","Warriors","Flames","Knights","Colonels","Racers","Trojans","Rockets","Zips","Miners","Hurricanes","Seahawks","Shockers","Mavericks","Lopes","Vandals","Camels","Peacocks","Red Storm","49ers","Demon Deacons","Sycamores","Billikens","Terriers","Paladins","Quakers","Anteaters","Gaels","Toreros","Leopards","Beacons","Hilltoppers","Cowboys","Runnin' Rebels","Gamecocks","Blue Devils","Hokies","Salukis","Flyers","Crimson","Big Green","Lions","Bearcats","Musketeers","Friars","Retrievers","Jaguars","Red Raiders","Golden Griffins","Matadors","Patriots","Bulls","Ospreys","Hatters","Penguins","Titans","Rattlers","Hornets","Bengals","Badgers","Sooners","Longhorns","Seminoles","Tar Heels","Terrapins","Hawks","Penguins"];
function schoolName(full){const name=String(full||"").trim();if(SCHOOL_OVERRIDES[name.toLowerCase()])return SCHOOL_OVERRIDES[name.toLowerCase()];const mascot=[...MASCOTS].sort((a,b)=>b.length-a.length).find(m=>name.toLowerCase().endsWith(" "+m.toLowerCase()));return mascot?name.slice(0,-mascot.length-1):name;}
const SCHOOL_OVERRIDES={
  "utah tech trailblazers":"Utah Tech","kent state golden flash":"Kent State",
  "kent state golden flashes":"Kent State","arizona state sundevils":"Arizona State",
  "arizona state sun devils":"Arizona State","new mexico lobos":"New Mexico",
  "utsa road runners":"UTSA","utsa roadrunners":"UTSA",
  "depaul blue demons":"DePaul","massachusetts minutemen":"Massachusetts",
  "william & mary tribe":"William & Mary","colgate raiders":"Colgate",
  "arkansas razorbacks":"Arkansas","loyola ramblers":"Loyola",
  "loyola chicago ramblers":"Loyola Chicago","long beach state beach":"Long Beach State",
  "san diego state aztecs":"San Diego State","pepperdine waves":"Pepperdine",
  "north carolina state wolfpack":"NC State",
  "north carolina st wolfpack":"NC State"
};
const CARD_W=184;
function Match({x,y,number,round,region,onSelect,seeds,game,side="left",historical=false}){
  const opening=Boolean(seeds),done=String(game?.status||"").toLowerCase()==="final",winner=game?.winnerFranchiseId;
  const interactive=!historical && (!game || Boolean(game.gameId));
  const renderTeam=(team,idx)=>{
    const seed=team?.seed??(opening?seeds[(number-1)*2+idx]:"–");
    const score=done&&team?.score!=null?team.score:"–";
    const name=schoolName(team?.name)||`Team ${number*2-1+idx}`;
    const isWinner=done&&winner&&team?.franchiseId===winner;
    return <span className={`pb-team ${side==="right"?"pb-team--right":""} ${isWinner?"pb-team-winner":""}`} key={idx}>
      {side==="right"?<><em>{score}</em><span className="pb-team-name" title={name}>{name}</span>{team?.logoUrl?<img src={team.logoUrl} alt="" loading="lazy"/>:<span className="pb-logo-spacer"/>}<b>{seed}</b></>:<><b>{seed}</b>{team?.logoUrl?<img src={team.logoUrl} alt="" loading="lazy"/>:<span className="pb-logo-spacer"/>}<span className="pb-team-name" title={name}>{name}</span><em>{score}</em></>}
    </span>;
  };
  return <button type="button" disabled={!interactive} className={`pb-match ${side==="right"?"pb-match--right":""}`} style={{left:x,top:y}} onClick={()=>onSelect({region,round,number,game})} title={`${region} · ${round} · Game ${number}`}>
    {renderTeam(game?.team1,0)}{renderTeam(game?.team2,1)}
  </button>;
}
function Region({region,onSelect,games=[],historical=false,hideLastRound=false}){
  const left=region.side==="left",baseX=region.x,baseY=region.y;
  const seeds=region.seeds||SEEDS,gameCount=seeds.length/2,rounds=Math.log2(gameCount)+1;
  const xs=left?[baseX,baseX+200,baseX+400,baseX+600]:[baseX+600,baseX+400,baseX+200,baseX];
  const step=region.step||50;
  const ys=Array.from({length:gameCount},(_,i)=>baseY+36+i*step);
  const centers=[ys.map(y=>y+22)];
  for(let r=1;r<rounds;r++)centers.push(Array.from({length:gameCount/2**r},(_,i)=>(centers[r-1][i*2]+centers[r-1][i*2+1])/2));
  const lines=[];
  for(let r=0;r<rounds-1-(hideLastRound?1:0);r++)for(let i=0;i<centers[r].length;i++){
    const x1=left?xs[r]+CARD_W:xs[r],x2=left?xs[r+1]:xs[r+1]+CARD_W,mid=(x1+x2)/2;
    lines.push(<path key={`${r}-${i}`} d={`M${x1} ${centers[r][i]} H${mid} V${centers[r+1][Math.floor(i/2)]} H${x2}`}/>);
  }
  const labels=region.rounds||["Round of 64","Round of 32","Sweet 16","Elite 8"];
  return <>
    <div className="pb-region-title" style={{left:left?baseX:baseX+600,top:baseY-34}}>{region.name.toUpperCase()} {region.label||"REGION"}</div>
    {xs.slice(0,rounds-(hideLastRound?1:0)).map((x,r)=><div key={r} className="pb-column-title" style={{left:x,top:baseY-12}}>{labels[r]}</div>)}
    <svg className="pb-lines" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">{lines}</svg>
    {centers.slice(0,rounds-(hideLastRound?1:0)).map((row,r)=>row.map((cy,i)=><Match key={`${r}-${i}`} x={xs[r]} y={cy-22} number={i+1} round={labels[r]} region={region.name} seeds={r===0?seeds:null} side={region.side} historical={historical} onSelect={onSelect} game={games[r]?.[i]}/>))}
  </>;
}
function ReactFragmentRegion({region,onSelect,games,historical,showWinner,hideLastRound=false}){
  return <><Region region={region} onSelect={onSelect} games={games} historical={historical} hideLastRound={hideLastRound}/>{showWinner?<RegionalWinnerLogo region={region} regionalGames={games}/>:null}</>;
}
function RegionalWinnerLogo({region,regionalGames}){
  const eliteEight=regionalGames?.[3]?.[0];
  if(!eliteEight||String(eliteEight.status||"").toLowerCase()!=="final")return null;
  const champion=[eliteEight.team1,eliteEight.team2].find(team=>team?.franchiseId&&team.franchiseId===eliteEight.winnerFranchiseId);
  if(!champion)return null;
  // Center the emblem on the Elite Eight card, above the top regions and below the bottom regions.
  const left=region.side==="left";
  const eliteCardX=left?region.x+600:region.x;
  const eliteCardY=region.y+36+(7*50)/2+(22-22); // last-round card top (8 opening games, 50px apart)
  const logoSize=76;
  const spacing=18;
  const isTopRegion=region.name==="West"||region.name==="East";
  const logoX=eliteCardX+(CARD_W-logoSize)/2;
  const logoY=isTopRegion?eliteCardY-logoSize-spacing:eliteCardY+44+spacing;
  return <div className={`pb-regional-winner pb-regional-winner--${left?"left":"right"}`} style={{left:logoX,top:logoY}} title={`${region.name} regional champion: ${champion.name||""}`}>
    {champion.logoUrl?<img src={champion.logoUrl} alt={`${champion.name||region.name} logo`} loading="lazy"/>:<span>{schoolName(champion.name)?.slice(0,2)||"🏆"}</span>}
  </div>;
}
function NationalMatch({game,onSelect,historical=false,side="left"}){
  const done=String(game?.status||"").toLowerCase()==="final";
  const winner=game?.winnerFranchiseId;
  return <button type="button" className="pb-national-match" disabled={historical} onClick={()=>onSelect({region:"National",round:game?.round||"Final Four",game})}>
    {[game?.team1,game?.team2].map((team,i)=>{
      const win=done&&winner&&team?.franchiseId===winner;
      return <div className={`pb-national-team ${win?"pb-national-team--winner":""}`} key={i}>
        {side==="right"?<>
          <strong className="pb-national-score">{done&&team?.score!=null?team.score:"–"}</strong>
          <span className="pb-national-name" title={team?.name||"TBD"}>{schoolName(team?.name)||"TBD"}</span>
          {team?.logoUrl?<img src={team.logoUrl} alt="" loading="lazy"/>:<span className="pb-national-logo"/>}
          <b className="pb-national-seed">{team?.seed??"–"}</b>
        </>:<>
          <b className="pb-national-seed">{team?.seed??"–"}</b>
          {team?.logoUrl?<img src={team.logoUrl} alt="" loading="lazy"/>:<span className="pb-national-logo"/>}
          <span className="pb-national-name" title={team?.name||"TBD"}>{schoolName(team?.name)||"TBD"}</span>
          <strong className="pb-national-score">{done&&team?.score!=null?team.score:"–"}</strong>
        </>}
      </div>;
    })}
  </button>;
}
function SemifinalWithWinner({game,onSelect,historical,side}){
  return <div className={`pb-semifinal-with-winner pb-semifinal-with-winner--${side}`}>
    <NationalMatch game={game} onSelect={onSelect} historical={historical} side={side}/>
  </div>;
}

export default function PostseasonBracket({tournament,season,onBack,initialRegion,games=[],loading=false,error=""}){const navigate=useNavigate();const viewport=useRef(null);const [width,setWidth]=useState(360);const [focus,setFocus]=useState(initialRegion||"all");const [detail,setDetail]=useState(null);const [showField,setShowField]=useState(false);const [fieldRecords,setFieldRecords]=useState({});const [fieldRecordStatus,setFieldRecordStatus]=useState('idle');useEffect(()=>{if(!showField)return;let cancelled=false;setFieldRecords({});setFieldRecordStatus('loading');fetch("https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec?action=postseasonfieldrecords&season="+encodeURIComponent(season)).then(r=>r.json()).then(data=>{if(cancelled)return;if(!data.ok)throw Error(data.error||'Records unavailable');setFieldRecords(data.records||{});setFieldRecordStatus('ready')}).catch(()=>{if(!cancelled)setFieldRecordStatus('unavailable')});return()=>{cancelled=true}},[showField,season]);const [manualZoom,setManualZoom]=useState(1);useEffect(()=>{if(!viewport.current)return;const obs=new ResizeObserver(e=>setWidth(e[0].contentRect.width));obs.observe(viewport.current);return()=>obs.disconnect()},[]);useEffect(()=>{setFocus(initialRegion||"all");setDetail(null);setShowField(false);setManualZoom(1)},[tournament.slug,initialRegion]);const is64=tournament.teams===64;const is32=tournament.teams===32;const is16=tournament.teams===16;const isNIT=tournament.slug==="nit";const isCrown=tournament.slug==="college-basketball-crown";const compact32=isNIT||isCrown;const canvasW=is64?W:compact32?1880:is16?1660:1480,canvasH=is64?H:1040;const fit=Math.min(width/canvasW,(is16?520:520)/canvasH);const zoom=focus==="all"?fit*manualZoom:Math.min(Math.max(width/530,.78),1.05)*manualZoom;const targets=is16?{all:[830,520],Left:[335,540],Right:[1106,540],final:[830,530]}:compact32?{all:[940,520],Left:[425,510],Right:[1455,510],final:[940,530]}:is64?{all:[W/2,H/2],West:[410,280],Midwest:[410,1130],East:[1430,280],South:[1430,1130],Left:[410,700],Right:[1430,700],final:[W/2,565]}:{all:[740,520],West:[360,275],Midwest:[360,775],East:[1120,275],South:[1120,775],Left:[360,510],Right:[1120,510],final:[740,505]};const [tx,ty]=targets[focus]||targets.all;const [pan,setPan]=useState({x:0,y:0});const drag=useRef(null);const style={transform:`translate(${width/2-tx*zoom+pan.x}px,${260-ty*zoom+pan.y}px) scale(${zoom})`};const historical=Number(season)<2027;const openMatch=info=>{if(historical)return;if(info?.game?.gameId){navigate(`/scores/${encodeURIComponent(info.game.gameId)}`);return;}setDetail(info)};const chooseFocus=v=>{setFocus(v);setManualZoom(1);setPan({x:0,y:0});setDetail(null)};const regions=is64?REGIONS:is32?[{name:"Left",x:20,y:300,side:"left",seeds:isNIT?[...NIT_SEEDS,...NIT_SEEDS]:CROWN_LEFT,rounds:compact32?["1st Round","2nd Round","Quarterfinals","Semifinals"]:["Round of 32","Sweet 16","Elite Eight","Semifinal"]},{name:"Right",x:compact32?1120:660,y:300,side:"right",seeds:isNIT?[...NIT_SEEDS,...NIT_SEEDS]:CROWN_RIGHT,rounds:compact32?["1st Round","2nd Round","Quarterfinals","Semifinals"]:["Round of 32","Sweet 16","Elite Eight","Semifinal"]}]:[{name:"Left",x:40,y:390,side:"left",seeds:NIT_SEEDS,step:80,rounds:["1st Round","Quarterfinals","Semifinals"],label:"HALF"},{name:"Right",x:716,y:390,side:"right",seeds:NIT_SEEDS,step:80,rounds:["1st Round","Quarterfinals","Semifinals"],label:"HALF"}];const marchReal=tournament.slug==="march-madness";const nitReal=tournament.slug==="nit";const cbiReal=is16;const realResults=marchReal||nitReal||isCrown||cbiReal;const roundNames=["Round of 64","Round of 32","Sweet 16","Elite 8"];const nitGames=nitReal?games.filter(g=>String(g.eventName||"").trim()==="NIT"):[];
const nitSeedMap=new Map();
if(nitReal)nitGames.filter(g=>String(g.round||"").trim()==="1st Round").forEach(g=>[g.team1,g.team2].forEach(t=>{if(t?.franchiseId&&t?.seed!=null)nitSeedMap.set(String(t.franchiseId),Number(t.seed));}));
const restoreNitSeeds=g=>{if(!g)return null;return {...g,team1:g.team1?{...g.team1,seed:nitSeedMap.get(String(g.team1.franchiseId))??g.team1.seed}:g.team1,team2:g.team2?{...g.team2,seed:nitSeedMap.get(String(g.team2.franchiseId))??g.team2.seed}:g.team2};};
const sortedNit=(round,quadrant)=>nitGames.filter(g=>String(g.round||"").trim()===round&&(!quadrant||String(g.bracket||"").trim()===quadrant)).sort((a,b)=>String(a.gameId||"").localeCompare(String(b.gameId||""))).map(restoreNitSeeds);
const nitRegionGames=name=>{const quads=name==="Left"?["Quadrant 1","Quadrant 2"]:["Quadrant 3","Quadrant 4"];
const opening=quads.flatMap(q=>{const available=sortedNit("1st Round",q);return Array.from({length:4},(_,i)=>{const a=NIT_SEEDS[i*2],b=NIT_SEEDS[i*2+1];return available.find(g=>[Number(g.team1?.seed),Number(g.team2?.seed)].sort((x,y)=>x-y).join(",")===[a,b].sort((x,y)=>x-y).join(","))||available[i]||null;});});
const second=quads.flatMap(q=>sortedNit("2nd Round",q));const quarters=quads.map(q=>sortedNit("Quarterfinals",q)[0]||null);
const semifinal=sortedNit("Semifinals")[name==="Left"?0:1]||null;
return [opening,second,quarters,[semifinal]];};
// Crown is seeded 1–32 overall. Derive every slot from the opening seed tree,
// rather than assuming that the source's quadrant labels match left/right order.
const crownGames=isCrown?games.filter(g=>String(g.eventName||" ").trim().toLowerCase()==="college basketball crown"):[];
const crownOpening=crownGames.filter(g=>Number(g.week)===19||/^(1st round|first round|round of 32)$/i.test(String(g.round||"").trim()));
const crownSeedMap=new Map();
crownOpening.forEach(g=>[g.team1,g.team2].forEach(t=>{if(t?.franchiseId&&t.seed!=null&&Number.isFinite(Number(t.seed)))crownSeedMap.set(String(t.franchiseId),Number(t.seed));}));
const restoreCrownSeeds=g=>!g?null:{...g,team1:g.team1?{...g.team1,seed:crownSeedMap.get(String(g.team1.franchiseId))??g.team1.seed}:g.team1,team2:g.team2?{...g.team2,seed:crownSeedMap.get(String(g.team2.franchiseId))??g.team2.seed}:g.team2};
const crownRound=g=>{const r=String(g.round||"").trim().toLowerCase();const w=Number(g.week);if(r.includes("championship")||w===23)return 4;if(r.includes("semi")||w===22)return 3;if(r.includes("quarter")||w===21)return 2;if(r.includes("2nd")||r.includes("second")||r.includes("round of 16")||w===20)return 1;if(r.includes("1st")||r.includes("first")||r.includes("round of 32")||w===19)return 0;return -1;};
const crownRegionGames=name=>{const seedOrder=name==="Left"?CROWN_LEFT:CROWN_RIGHT;return [0,1,2,3].map(round=>{const size=2**(round+1);const count=16/size;const available=crownGames.filter(g=>crownRound(g)===round).map(restoreCrownSeeds);const used=new Set();return Array.from({length:count},(_,i)=>{const expected=new Set(seedOrder.slice(i*size,(i+1)*size));const match=available.find(g=>!used.has(g.gameId)&&[g.team1,g.team2].some(t=>t?.seed!=null&&expected.has(Number(t.seed))));if(match)used.add(match.gameId);return match||null;});});};
const crownFinal=crownGames.find(g=>crownRound(g)===4);
// CBI: two independently seeded 1–8 halves; 2026 GAME_RESULTS has 8 + 4 + 2 + 1 games.
const cbiGames=cbiReal?games.filter(g=>String(g.eventName||"").trim().toUpperCase()==="CBI"):[];
const cbiRound=g=>{const r=String(g.round||"").trim().toLowerCase();const w=Number(g.week);if(r.includes("championship")||w===22)return 3;if(r.includes("semi")||w===21)return 2;if(r.includes("quarter")||w===20)return 1;if(r.includes("1st")||r.includes("first")||w===19)return 0;return -1;};
const cbiOrdered=round=>cbiGames.filter(g=>cbiRound(g)===round).sort((a,b)=>String(a.gameId||"").localeCompare(String(b.gameId||"")));
const cbiOpening=cbiOrdered(0);
const cbiRegionGames=name=>{const offset=name==="Left"?0:4;const opening=cbiOpening.slice(offset,offset+4);const order=Array.from({length:4},(_,i)=>{const a=NIT_SEEDS[2*i],b=NIT_SEEDS[2*i+1];return opening.find(g=>[Number(g.team1?.seed),Number(g.team2?.seed)].sort((x,y)=>x-y).join(",")===[a,b].sort((x,y)=>x-y).join(","))||opening[i]||null;});const quarters=cbiOrdered(1).slice(name==="Left"?0:2,name==="Left"?2:4);const semis=cbiOrdered(2);return [order,quarters,[semis[name==="Left"?0:1]||null]];};
const cbiFinal=cbiOrdered(3)[0]||null;
const gamesForRegion=(name)=>{if(nitReal)return nitRegionGames(name);if(isCrown)return crownRegionGames(name);if(cbiReal)return cbiRegionGames(name);if(!marchReal)return [];return roundNames.map((round,r)=>{const items=games.filter(g=>String(g.bracket||"").toLowerCase()===name.toLowerCase()&&String(g.round||"").toLowerCase()===round.toLowerCase());const ordered=[...items].sort((a,b)=>String(a.gameId||"").localeCompare(String(b.gameId||"")));if(r===0){const region=REGIONS.find(x=>x.name===name);return Array.from({length:8},(_,i)=>{const a=SEEDS[2*i],b=SEEDS[2*i+1];return ordered.find(g=>[Number(g.team1?.seed),Number(g.team2?.seed)].sort((x,y)=>x-y).join(",")===[a,b].sort((x,y)=>x-y).join(","))||ordered[i]||null;});}return ordered;});};const nationalGames=marchReal?games.filter(g=>g.eventName==="March Madness"&&["Final 4","Championship"].includes(g.round)).sort((a,b)=>String(a.gameId).localeCompare(String(b.gameId))):nitReal?[...sortedNit("Semifinals"),...sortedNit("Championship")]:[];const nationalSemis=nationalGames.filter(g=>g.round==="Final 4"||(nitReal&&g.round==="Semifinals"));const nationalFinal=cbiReal?cbiFinal:isCrown?restoreCrownSeeds(crownFinal):nationalGames.find(g=>g.round==="Championship");const fieldGroups=useMemo(()=>{
  const readTeams=(matches,groupName)=>{const seen=new Map();matches.filter(Boolean).forEach(g=>[g.team1,g.team2].forEach(t=>{const id=String(t?.franchiseId||t?.name||"").trim();if(!id||!t?.name||String(t.name).toLowerCase()==="tbd")return;if(!seen.has(id))seen.set(id,{id,name:t.name,logoUrl:t.logoUrl||"",seed:t.seed,bracket:groupName,coachId:t.coachId||"",coachName:t.coachName||""})}));return [...seen.values()].sort((a,b)=>Number(a.seed||99)-Number(b.seed||99)||a.name.localeCompare(b.name))};
  if(is64)return ["West","Midwest","East","South"].map(name=>({name,teams:readTeams(gamesForRegion(name)[0]||[],name)}));
  if(isNIT||isCrown||is16)return ["Left","Right"].map(name=>({name:name+" Half",teams:readTeams(gamesForRegion(name)[0]||[],name)}));
  return [];
},[games,is64,isNIT,isCrown,is16]);
const fieldTeams=fieldGroups.flatMap(group=>group.teams);
const representation=useMemo(()=>{const counts=new Map();fieldTeams.forEach(t=>{const c=String(fieldRecords[t.id]?.conference||"").trim();if(c)counts.set(c,(counts.get(c)||0)+1)});return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))},[fieldTeams,fieldRecords]);
const matchupText=g=>g?`${g.team1?.name||"TBD"} ${g.team1?.score??""} vs ${g.team2?.name||"TBD"} ${g.team2?.score??""}`:"TBD vs TBD";return <section className="pb-page"><div className="pb-header"><div><span>INTERACTIVE BRACKET</span><h2>{season?`${season} `:""}{tournament.slug==="college-basketball-crown"?"College Basketball Crown":tournament.name}</h2><p className="pb-subtitle">{tournament.teams} teams · {is16?"Select a half to zoom, or drag to pan":"Select a region to zoom"} · {realResults?(loading?"Loading results…":error||"2026 results / upcoming matchups"):"No live scores yet"}<button type="button" className="pb-field-link" onClick={()=>setShowField(v=>!v)}>{showField?"← Back to Bracket":"View Tournament Field ↗"}</button></p></div></div>{showField?<div className="pb-field-page"><div className="pb-field-heading"><strong>TOURNAMENT FIELD</strong><span>{fieldTeams.length} of {tournament.teams} entrants identified from opening-round games</span></div>{loading?<p>Loading field…</p>:error?<p>{error}</p>:fieldTeams.length===0?<p>Opening-round team data is not available yet.</p>:<>{fieldGroups.map(group=><section className="pb-field-group" key={group.name}><h3>{group.name} · {group.teams.length} teams</h3><div className="pb-field-list">{group.teams.map(t=><div className="pb-field-team" key={t.id}><b className="pb-field-seed">{t.seed||"—"}</b>{t.logoUrl?<img src={t.logoUrl} alt=""/>:<span className="pb-field-logo-fallback">◆</span>}<span className="pb-field-team-identity"><a className="pb-field-team-name pb-field-profile-link" href={`/franchise/${encodeURIComponent(t.id)}`} onClick={e=>{e.preventDefault();navigate(`/franchise/${encodeURIComponent(t.id)}`)}}>{t.name}</a><span className="pb-field-coach">{t.coachName?(t.coachId?<a className="pb-field-profile-link" href={`/coach/${encodeURIComponent(t.coachId)}`} onClick={e=>{e.preventDefault();navigate(`/coach/${encodeURIComponent(t.coachId)}`)}}>{t.coachName}</a>:t.coachName):"Coach unavailable"}</span></span>{fieldRecords[t.id]?.conference?<span className="pb-field-conference" title={fieldRecords[t.id].conference}>{CONFERENCE_BADGES[fieldRecords[t.id].conference]?<img src={CONFERENCE_BADGES[fieldRecords[t.id].conference]} alt=""/>:null}<span>{CONFERENCE_LABELS[fieldRecords[t.id].conference]||fieldRecords[t.id].conference}</span></span>:null}<span className="pb-field-record">{fieldRecords[t.id]?`${fieldRecords[t.id].wins}–${fieldRecords[t.id].losses}${Number(fieldRecords[t.id].ties)>0?`–${fieldRecords[t.id].ties}`:""}`:"Record —"}</span></div>)}</div></section>)}{representation.length>0?<div className="pb-field-representation"><h3>CONFERENCE REPRESENTATION</h3><div className="pb-field-representation-grid">{representation.map(([conf,count])=><div className="pb-field-representation-item" key={conf}>{CONFERENCE_BADGES[conf]?<img src={CONFERENCE_BADGES[conf]} alt=""/>:null}<span>{CONFERENCE_LABELS[conf]||conf}</span><strong>{count}</strong></div>)}</div></div>:null}<p className="pb-field-disclaimer">{fieldRecordStatus==="loading"?"Loading Week 18 records…":fieldRecordStatus==="unavailable"?"Week 18 records unavailable. Confirm the v32 Apps Script deployment.":"Records reflect overall results through Week 18 where available. Conference representation will be added next."}</p></>}</div>:<><div className="pb-toolbar">{is16?<><button onClick={()=>chooseFocus("all")} className={focus==="all"?"active":""}><Maximize2 size={14}/> Full bracket</button><button onClick={()=>chooseFocus("Left")} className={focus==="Left"?"active":""}>Left</button><button onClick={()=>chooseFocus("Right")} className={focus==="Right"?"active":""}>Right</button></>:<><button onClick={()=>chooseFocus("all")} className={focus==="all"?"active":""}><Maximize2 size={14}/> Full bracket</button>{regions.map(r=><button key={r.name} className={focus===r.name?"active":""} onClick={()=>chooseFocus(r.name)}>{r.name}</button>)}{!compact32?<button className={focus==="final"?"active":""} onClick={()=>chooseFocus("final")}>Final Four</button>:null}</>}</div><div className="pb-viewport" ref={viewport} onPointerDown={e=>{if(e.target.closest(".pb-minimap,.pb-zoom"))return;drag.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current)return;setPan({x:drag.current.px+e.clientX-drag.current.x,y:drag.current.py+e.clientY-drag.current.y})}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}><div className={`pb-canvas ${is64?"pb-canvas--64":compact32?"pb-canvas--nit":is16?"pb-canvas--cbi":""}`} style={style}><div className="pb-canvas-title">{tournament.slug==="college-basketball-crown"?"COLLEGE BASKETBALL CROWN":tournament.name.toUpperCase()} · {tournament.teams}-TEAM BRACKET</div>{regions.map(r=><ReactFragmentRegion key={r.name} region={r} onSelect={openMatch} games={gamesForRegion(r.name)} historical={historical&&realResults} showWinner={marchReal} hideLastRound={false}/>)}<div className={`pb-final ${is16?"pb-final--cbi":is32?"pb-final--32":""} ${realResults?"pb-final--real":""}`}>
  {!compact32?<span>{is16?"CHAMPIONSHIP":"FINAL FOUR"}</span>:null}
  {!is16&&!compact32?<div className="pb-semifinal-row">{realResults?<><SemifinalWithWinner game={nationalSemis[0]} onSelect={openMatch} historical={historical} side="left"/><SemifinalWithWinner game={nationalSemis[1]} onSelect={openMatch} historical={historical} side="right"/></>:<><button onClick={()=>setDetail({round:"Final Four",region:"National",number:1})}>Semifinal 1 · TBD</button><button onClick={()=>setDetail({round:"Final Four",region:"National",number:2})}>Semifinal 2 · TBD</button></>}</div>:null}
  <strong>🏆 {isNIT?"NIT CHAMPIONSHIP":isCrown?"COLLEGE BASKETBALL CROWN CHAMPIONSHIP":cbiReal?"CBI CHAMPIONSHIP":"NATIONAL CHAMPIONSHIP"}</strong>
  {realResults?<div className="pb-championship-card"><NationalMatch game={nationalFinal} onSelect={openMatch} historical={historical}/></div>:<button onClick={()=>setDetail({round:"Championship",region:"National",number:1})}>TBD vs TBD</button>}
     {realResults&&nationalFinal?.winnerFranchiseId&&String(nationalFinal.status||"").toLowerCase()==="final"?(()=>{
      const champion=[nationalFinal.team1,nationalFinal.team2].find(team=>team?.franchiseId===nationalFinal.winnerFranchiseId);
      return champion?<div className="pb-champion-spotlight">
        {champion.logoUrl?<img src={champion.logoUrl} alt={`${champion.name||"Champion"} logo`} loading="lazy"/>:<span className="pb-champion-placeholder">🏆</span>}
        <strong>{champion.name||"Champion"}</strong>
        {champion.coachName?<span>{champion.coachName}</span>:null}
      </div>:null;
    })():null}
</div></div>{!is16?<div className="pb-minimap"><div className="pb-map-title">BRACKET MAP</div><div className={`pb-map-grid ${is32?"pb-map-grid--32":""}`}>{(is64?["West","East","Midwest","South"]:["Left","Right"]).map(r=><button key={r} className={focus===r?"selected":""} onClick={()=>chooseFocus(r)} aria-label={`Zoom to ${r}`} >{r}</button>)}{!compact32?<button className={`pb-map-center ${focus==="final"?"selected":""}`} onClick={()=>chooseFocus("final")}>FINAL</button>:null}</div><button className="pb-map-reset" onClick={()=>chooseFocus("all")}>Fit all</button></div>:null}{(focus!=="all"||is16)?<div className="pb-zoom"><button onClick={()=>setManualZoom(z=>Math.max(.7,z-.15))} aria-label="Zoom out"><Minus size={16}/></button><button onClick={()=>setManualZoom(z=>Math.min(2,z+.15))} aria-label="Zoom in"><Plus size={16}/></button></div>:null}</div>{detail?<div className="pb-detail"><strong>{detail.region} · {detail.round} · Game {detail.number}</strong><span>{detail.game?`${detail.game.team1?.name||"TBD"} vs ${detail.game.team2?.name||"TBD"} · ${detail.game.status||"Scheduled"} · ${detail.game.gameId}`:"Placeholder matchup. No real game record mapped to this slot."}</span><button onClick={()=>setDetail(null)}>Close</button></div>:null}<p className="pb-footnote">{realResults?`${tournament.name}: GAME_RESULTS data where available. ${cbiReal?"All four postseason brackets are now connected to results.":isCrown?"March Madness and NIT remain unchanged; CBI is still in demo mode.":nitReal?"March Madness is unchanged; Crown and CBI remain in demo mode.":"Other tournaments are being connected individually."}`:"Prototype: seeded placeholder teams only; live data not yet connected."}</p></>}</section>}
