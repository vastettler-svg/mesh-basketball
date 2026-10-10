import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import "../styles/sleeperLeagues.css";
import patch_american_png from "../assets/conference-badges/american.png";
import patch_acc_png from "../assets/conference-badges/acc.png";
import patch_big_12_png from "../assets/conference-badges/big-12.png";
import patch_big_east_png from "../assets/conference-badges/big-east.png";
import patch_big_ten_png from "../assets/conference-badges/big-ten.png";
import patch_coastal_png from "../assets/conference-badges/coastal.png";
import patch_c_usa_png from "../assets/conference-badges/c-usa.png";
import patch_ivy_png from "../assets/conference-badges/ivy.png";
import patch_mac_png from "../assets/conference-badges/mac.png";
import patch_mountain_west_png from "../assets/conference-badges/mountain-west.png";
import patch_ovc_png from "../assets/conference-badges/ovc.png";
import patch_sec_png from "../assets/conference-badges/sec.png";
import patch_sun_belt_png from "../assets/conference-badges/sun-belt.png";
import patch_west_coast_png from "../assets/conference-badges/west-coast.png";
const conferences=[
{name:"American Athletic",patch:patch_american_png,url:"https://sleeper.com/i/V9ba8XBQkAlaO"},
{name:"Atlantic Coast",patch:patch_acc_png,url:"https://sleeper.com/i/LVDnOq2VjbBMX"},
{name:"Big 12",patch:patch_big_12_png,url:"https://sleeper.com/i/kMgBm1PBGXaqK"},
{name:"Big East",patch:patch_big_east_png,url:"https://sleeper.com/i/j7zDeGbDVLN4o"},
{name:"Big Ten",patch:patch_big_ten_png,url:"https://sleeper.com/i/kMgBmwjVbJOLx"},
{name:"Coastal",patch:patch_coastal_png,url:"https://sleeper.com/i/zEVDaGjweBY0q"},
{name:"Conference USA",patch:patch_c_usa_png,url:"https://sleeper.com/i/j7zla1b5Pka9w"},
{name:"Ivy League",patch:patch_ivy_png,url:"https://sleeper.com/i/m7VLE7d8DROzG"},
{name:"Mid American",patch:patch_mac_png,url:"https://sleeper.com/i/LVDnEDoGjWRwW"},
{name:"Mountain West",patch:patch_mountain_west_png,url:"https://sleeper.com/i/j7zDbZdGxdNaW"},
{name:"Ohio Valley",patch:patch_ovc_png,url:"https://sleeper.com/i/E8XlBPBNJM977"},
{name:"SEC",patch:patch_sec_png,url:"https://sleeper.com/i/E8XgeN0LX3KQQ"},
{name:"Sun Belt",patch:patch_sun_belt_png,url:"https://sleeper.com/i/V9baX6XA3aOx6"},
{name:"West Coast",patch:patch_west_coast_png,url:"https://sleeper.com/i/Y21qllqOe7Azj"}
];
export default function SleeperLeagues(){return <div className="sleeper-leagues-page"><Link className="sleeper-leagues-back" to="/more"><ArrowLeft size={15}/> Back to More</Link><header className="sleeper-leagues-heading"><span>LEAGUE LINKS</span><h1>Sleeper Leagues</h1><p>Choose your conference to join its MESH Basketball league on Sleeper.</p></header><div className="sleeper-leagues-list">{conferences.map(item=><a className="sleeper-leagues-card" key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Join ${item.name} on Sleeper (opens in new tab)`}><span className="sleeper-leagues-patch"><img src={item.patch} alt={`${item.name} conference patch`}/></span><span className="sleeper-leagues-info"><strong>{item.name}</strong><small>Click to join league on Sleeper</small></span><ExternalLink size={17} className="sleeper-leagues-external"/></a>)}</div></div>;}
