/* Device drafts only. Shared route documents require an explicit save action. */
const ScenarioStore={
 key(key,context){return 'anno.scenario.v1.'+JSON.stringify([context,AR.assets_sha256,key]);},
 read(key,context){try{const saved=JSON.parse(localStorage.getItem(this.key(key,context))||'null');if(saved?.schema!==1)return {};const s=saved.state;if(!s||!K.factories.some(f=>f.factory_guid===s.factory&&f.outputs[0].product_guid===s.good&&f.regions.includes(s.region)))return {};return s;}catch{return {};}},
 save(s){try{const state={factory:s.factory,good:s.good,region:s.region,area:s.area,origin:'manual',choices:s.choices,productivity:s.productivity,modifiers:s.modifiers,patron:s.patron,belief:s.belief,season:s.season,defaultProductivity:s.defaultProductivity,open:s.open,expandedSteps:s.expandedSteps};localStorage.setItem(this.key(s.key,s.context),JSON.stringify({schema:1,at:new Date().toISOString(),state}));return true;}catch{return false;}}
};
