# Pannonia: population and needs design

*Version 2 — working design proposal.* [Read the region concept](README.md) · [Historical research and implementation framework](pannonia-research-and-skeleton.en.md)

## 1. What this version develops

This plan goes beyond assigning names to 24 cumulative need slots. Each choice considers:

1. Its historical plausibility in Pannonia around AD 117.
2. A specific base-game donor and the new assets required.
3. Its production recipe or service behaviour.
4. Its economic role at the relevant population tier.
5. A meaningful distinction between the two development paths.
6. Connections between the Danube, wetlands, local communities, towns and the army.

Needs are cumulative **choices**, rather than 24 individually compulsory consumption requirements. Anno 117 uses supply points and progression thresholds within categories; broader fulfilment can provide population, income or other bonuses.

## 2. Population names and development paths

```text
T1 — Provinciales / Provincial Population
 ├─ T2 — Vicani / Vicus Residents
 │    └─ T3 — Principes / Civitas Notables
 └─ T2 — Municipes / Municipal Citizens
      └─ T3 — Decuriones / Municipal Councillors
```

- **Provinciales** is a readable umbrella name for the province's free population. The legally narrower *peregrini* would more precisely describe free non-citizens, but is ambiguous to English readers and excludes parts of the mixed starting population.
- **Vicani** names the residents of a *vicus*, grounded in inscriptions and settlement history. It is not an ethnic category: local families, veterans, immigrant craftspeople and traders could share these communities.
- **Principes** refers to the leading elite of local civitates, a title documented in Pannonia. “Civitas Notables” communicates the intended meaning; it should not suggest later hereditary princes. For a future Hungarian UI, *Civitas-előkelők* would make that distinction clear.
- **Municipes** denotes citizens of a community with Roman municipal status. “Municipal Citizens” is the readable English label; the Latin name can remain in a classicising UI. The proposed Hungarian equivalent is *Városi polgárok*.
- **Decuriones** is the council elite of municipia and coloniae, consistent with the Roman path in the separate Achaea concept.

The paths do not represent “natives versus Romans.” One develops provincial life through civitas/vicus institutions; the other emphasises citizenship, municipal institutions and imperial integration. A family could move between these positions over several generations.

## 3. Reuse classifications

| Label | Meaning |
| --- | --- |
| **V0 — direct base-game reuse** | Existing good and largely unchanged building. |
| **V1 — regional variant** | Existing recipe/mechanic with a regional name, icon or visual variant. |
| **V2 — hybrid** | Existing inputs and production logic, but a new output or service. |
| **N — new system/asset** | Reserved for a strong regional identity or a meaningful new gameplay role. |

The design target is approximately 70–75% V0/V1, 15–20% V2 and at most 10% entirely new content. These are scope targets, not a completed asset audit.

## 4. Shared T1 — Provinciales

### Food

| Need | Chain | Donor | Tier and regional role |
| --- | --- | --- | --- |
| **Grain Porridge** | Oats or general grain → porridge kitchen | Latium porridge, V0/V1 | Affordable dry-land starting food; progression remains possible with little wetland space. |
| **Freshwater Fish** | River fishing hut **or** backwater eel-catching ground → fish | Latium Fishing Hut + Albion Eel Grabber, V1 | One need slot with two landscape-dependent production methods. Open riverbanks and marshy backwaters require different layouts without creating duplicate finished goods. |

**Decision:** do not introduce Pannonian Cockles. Albion's shellfish gathering belongs to its coastal setting. Reuse wetland placement, eel-catching and fishing logic instead.

### Public services

| Need | Operation | Donor | Tier and regional role |
| --- | --- | --- | --- |
| **Market** | Basic trade and service coverage for nearby homes | Shared Market, V0; optional regional skin | Local exchange between civilian and military settlements. |
| **Wayside Shrine — Sacellum** | Small service area; later choice of a local/Roman cult | Albion Fanum choice + Latium Sanctuary, V2 | Introduces religious syncretism at T1 without copying Albion's deities. Suits road junctions and settlement edges. |

### Clothing / Fashion

| Need | Chain | Donor | Tier and regional role |
| --- | --- | --- | --- |
| **Tunics** | Hemp/wool → spinning/weaving → tunics | Base-game Tunics, V0 | A shared everyday clothing need across the starting population. |
| **Woollen Cloaks** | Sheep → wool → cloak maker | Albion/Latium wool chain, V1 | Fits a cooler, wetter frontier and civilian/military travel. |

T1 teaches two complementary patterns of land use: **floodplain production** with fish, eels, reeds, walkways and limited building space; and **dry-ground production** with grain, sheep, timber and ordinary roads. A broad supply mix should reward using both without making either landscape an unavoidable progression trap.

## 5. Local provincial path

## T2 — Vicani

### Food

| Need | Chain | Donor | Why T2? |
| --- | --- | --- | --- |
| **Pannonian Grain Beer** | Barley or millet → malting/brewing → grain beer | Albion beer, V1 | A regional drink with an existing mechanical donor. The later-attested name *sabaia/sabaea* can appear in background text; the AD 117 UI should retain the more cautious descriptive name. |
| **Fruit Baskets** | Orchard fruit + woven baskets → market fruit baskets | Orchard/farm + basket, V2 | Connects apple, pear, plum and cherry growing with wetland weaving. Each fruit does not need a separate consumption GUID. |

### Public services

| Need | Operation | Donor | Why T2? |
| --- | --- | --- | --- |
| **Vicus Hall** | Community service with modest local craft/workforce bonuses | Albion Bard's Hearth/Alder Council logic, V2 | The civic and economic centre of a mixed rural settlement. |
| **Civitas Sanctuary** | Choice of a Pannonian–Roman cult with different economic effects | Fanum deity choice, V2 | The first institutional specialisation: woodland/animals, river/fishing, crafts or military connections. |

Finalise the cult list through a separate source review. Silvanus, river and spring cults, local mother goddesses and a Romanised civitas deity are possible starting points. Later Mithraic, Dolichenian or monumental Isiac developments should not automatically be projected back to AD 117.

### Clothing / Fashion

| Need | Chain | Donor | Why T2? |
| --- | --- | --- | --- |
| **Braccae — Woollen Trousers** | Wool → cloth → tailor | Albion trousers, V1 | Reuses the mechanic for a northern/provincial garment rather than treating it as an imported Albion costume. |
| **Norico-Pannonian Fibulae** | Bronze → fibula workshop → brooches | Existing brooch/fibula logic, V1/V2 | A regional clothing marker associated with local and Roman forms of dress, rather than a single ethnic identity. |

### Household

| Need | Chain | Donor | Why T2? |
| --- | --- | --- | --- |
| **Pannonian Pottery** | Clay → pottery workshop → cooking/storage vessels | Amphora/pottery system, V1 | Combines local forms with Roman workshop techniques. Related workshops can later specialise in lamps, amphorae and fine tableware. |
| **Woven Baskets** | Reeds or willow → basket weaver → baskets | Reed Gatherer + new processor, V2 | A signature good connecting wetlands with household consumption and logistics. |

The Vicani economy favours local inputs, shorter chains, less dependence on imports, food/workforce/raw-material output and productive use of marshes, forests, pastures and clay. Its tax yield is lower, balanced by productivity and regional self-sufficiency.

## T3 — Principes

### Food

| Need | Chain | Donor | Design role |
| --- | --- | --- | --- |
| **Smoked Meats** | Pork or beef + timber/salt → smokehouse → preserved meat | Livestock + smokehouse recipe, V1/V2 | Links animal husbandry to military provisions and a storable export surplus. |
| **Pelso Wine** | Grapes → winery → maturation cellar → wine | Latium wine, V1 | A lake-region industry developed by the player in the late game, without claiming that the full later Roman villa landscape already existed in AD 117. Imported wine can substitute. |

### Public services

| Need | Operation | Donor | Design role |
| --- | --- | --- | --- |
| **Civitas Council House** | Decree slots for farming, crafts, trade or frontier provisioning | Alder Council/decree system, V2 | Gives the notables an institutional role beyond happiness. |
| **Spring Bath and Healing Sanctuary** | Health/happiness; stronger with clean water or spring proximity | Bath/Sanctuary hybrid, V2 | Combines local sacred places and Roman bathing; rural communities need not all require aqueducts. |

### Clothing / Fashion

| Need | Chain | Donor | Design role |
| --- | --- | --- | --- |
| **Fine Woollen Mantles** | Selected wool → fine cloth → mantles | Fine clothing/toga chain, V1 | An elite output for local animal husbandry. |
| **Amber Jewellery** | Imported amber + bronze/silver → jeweller | Brooch/jewellery system, V2 | Turns Savaria and Scarbantia's Amber Road connections into a trade dependency. Fibulae, pendants or beads are possible forms. Amber is imported, not locally mined. |

### Household

| Need | Chain | Donor | Design role |
| --- | --- | --- | --- |
| **Fine Pannonian Tableware** | Fine clay → specialised pottery → slipped tableware | Pottery system, V1/V2 | An early regional industry expanded by the player. The surface treatment is slip, not a true glaze; workshop chronology still needs review. |
| **Riding Horses** | Pasture → breeder → training paddock → riding horses | Albion horse/pasture system, V1/V2 | Civilian prestige and transport demand linked to the cavalry economy. Military mounts also require tack and a fort. |

### Marvels

| Marvel | Role | Historical treatment |
| --- | --- | --- |
| **Sacred Precinct of Gorsium** | Cult/festival centre with regional happiness, diplomacy and religious effects | Builds on settlement growth after AD 105–106. Its identification as the exclusive provincial imperial-cult centre is debated; present a sacred precinct rather than an undisputed official central temple. |
| **Aquincum Spring and Bath District** | Springworks, aqueduct, baths and sacred spaces; health, happiness and prestige | Aquincum's aqueduct drew on springs at present-day Rómaifürdő. The project joins natural water resources and engineering rather than making bathing the exclusive property of the municipal path. |

## 6. Municipal Roman path

## T2 — Municipes

### Food

| Need | Chain | Donor | Why T2? |
| --- | --- | --- | --- |
| **Bread** | Wheat → mill → bakery → bread | Latium bread, V0 | Supports concentrated urban populations and large-scale military food supply. |
| **Garum** | Fish + imported/local salt → garum workshop | Latium garum, V0/V1 | Encourages trade and connects to imperial consumption evidenced through amphorae. It does not require an invented Pannonian seacoast. |

### Public services

| Need | Operation | Donor | Why T2? |
| --- | --- | --- | --- |
| **Public Baths** | Health/happiness; water and fuel demand | Latium Bath, V0/V1 | A shared institution of camps, canabae and towns. Start with smaller early baths rather than assuming the later monumental remains already exist. |
| **Mansio — Road Station** | Residential service plus bonuses to nearby roads, carts and trade transport | Tavern/road-logistics hybrid, V2 | Makes frontier roads and Amber Road traffic active mechanics; main-road placement matters. |

### Clothing / Fashion

| Need | Chain | Donor | Why T2? |
| --- | --- | --- | --- |
| **Sandals** | Leather → shoemaker → sandals | Latium sandals, V0 | Direct reuse and urban craft production. |
| **Fine Tunics** | Hemp/wool + dye → tailor → fine tunics | Tunic/fine-clothing chain, V1 | A refined version of the T1 garment using established materials. |

### Household

| Need | Chain | Donor | Why T2? |
| --- | --- | --- | --- |
| **Amphorae** | Clay + resin → potter → amphorae | Latium amphorae, V0 | Packaging for wine, oil and garum; makes the import network tangible. |
| **Terracotta Oil Lamps** | Clay → lamp workshop → lamps; olive-oil supply may provide an additional consumption bonus | Pottery/lamp asset, V1/V2 | Connects to early military pottery/lamp production at Aquincum. Treat the lamp and its oil separately to avoid an unnecessarily long basic recipe. |

The municipal economy offers higher taxes and denser urban settlement in exchange for more processing, services and dependence on roads. Salt, oil, resin or wine imports connect it with warehouses, harbours, carts and military provisioning.

## T3 — Decuriones

### Food

| Need | Chain | Donor | Design role |
| --- | --- | --- | --- |
| **Imported Vintage Wine** | Trade route → amphorae → wine merchant | Latium wine + trade, V0/V1 | Deliberate counterpart to local Pelso wine: a similar category with different logistics. |
| **Dried and Honeyed Fruits** | Fruit + honey → drying/preservation workshop → fruit dish | Orchard + honey, V2 | Turns local surplus into elite food and exports. Imported figs/dates can be optional alternative inputs, not local harvests. |

### Public services

| Need | Operation | Donor | Design role |
| --- | --- | --- | --- |
| **Forum and Basilica** | Taxation, administration and commerce; decree or official slot | Latium Forum, V0/V1 | Centre of the council elite's civic authority. |
| **Grammaticus School** | Knowledge and administrative workforce; may consume writing tablets | Latium Grammaticus, V0 | Supports civic government and Latin literacy. |

### Clothing / Fashion

| Need | Chain | Donor | Design role |
| --- | --- | --- | --- |
| **Togas** | Fine cloth → togas | Latium toga, V0 | A status/citizenship marker reserved here for the municipal elite. |
| **Silver Fibulae** | Silver/imported metal → silversmith → decorative fibulae | Brooch/jewellery system, V1 | Fibulae occur on both paths, with different materials and roles: provincial dress/amber trade versus urban rank and luxury. |

### Household

| Need | Chain | Donor | Design role |
| --- | --- | --- | --- |
| **Writing Tablets** | Timber + wax → tablet maker | Existing writing tablets, V0 | Shared demand from the army, governor's administration and town councils. |
| **Fine Glassware** | Imported/local glass → glassworker or merchant | Existing fine glass, V0/V1 | Elite household consumption and trade without requiring an entirely new regional industry. |

### Marvels

| Marvel | Role | Historical treatment |
| --- | --- | --- |
| **Governor's Palace at Aquincum** | Provincial administration, river harbour and imperial favour | Develops an early second-century government centre without placing the entire later metropolis in AD 117. |
| **Forum and Capitolium of Savaria** | Veteran colony, Amber Road commerce and civic prestige | Its Claudian foundation and pre-117 urban development provide a stronger early urban anchor. |

## 7. One connected economy

| Local provincial strengths | Municipal Roman strengths |
| --- | --- |
| Grain, pigs, sheep and cheese | Bread and processed food |
| Reeds, baskets and timber | Amphorae, lamps, bricks and urban pottery |
| Woollen clothing and regional fibulae | Fine tunics, togas and luxury fibulae |
| Local wine and slipped tableware | Imported wine, glassware and writing tablets |
| Civitas decrees and rural productivity | Roads, taxes, knowledge and administration |

The strongest province sustains both paths. Its rural communities supply food and materials to the canabae and towns, which return markets, processing, infrastructure and long-distance connections.

## 8. Orchards and fruit processing

### Historical plant palette

Keep three groups distinct when reviewing Roman-period botanical evidence:

- **Locally growable or previously known:** apples, pears, cherry/sour-cherry-type Prunus species, hazelnuts and gathered wild fruit.
- **Expanded through Roman horticulture:** plums, peaches, apricots, walnuts and cultivated grapes.
- **Primarily imports:** figs, olives and dates.

Many finds cover the Roman period broadly or come from later deposits. The concept should not imply that every later-attested fruit was already mass-produced in northern Pannonia in AD 117.

### Modular Orchard

Use one general **Orchard** fertility with alternative planted modules:

```text
Orchard
 ├─ Apple–pear grove
 ├─ Plum–cherry grove
 └─ Walnut–peach grove — later development
          ↓
        Fruit
```

Avoid five or six duplicate fertility types and chains. Modules provide visual variation, modest bonus differences and historical character while producing the same **Fruit** input.

### Processing

```text
Fruit + Woven Baskets → Fruit Baskets — Vicani T2 Food
Fruit + Honey → Dried and Honeyed Fruits — Decuriones T3 Food
Fruit → Dried Fruit — optional army, ship and long-distance provisions
```

This connects hillside horticulture, floodplain weaving and urban/military markets into one regional network.

### Competing demand for baskets

Woven Baskets serve three roles:

1. A Vicani T2 Household need.
2. Required packaging for Fruit Baskets.
3. Optional inputs to fishing, harvesting, storage and frontier provisioning.

Allocating all baskets to homes would interrupt fruit packing; excessive commercial consumption would undermine household supply. Let durable baskets be consumed more slowly than food baskets so the two demands have different rhythms.

Initial balancing sketch, not a final recipe:

```text
2 Fruit + 1 Woven Basket → 1 Fruit Basket
```

Baskets are not returnable packaging. Consumption abstracts damage, wear and replacement, avoiding a separate empty-basket return mechanic.

### Landscape roles

- **Buda hills around Aquincum:** orchards and urban markets.
- **Savaria–Scarbantia corridor:** road-connected fruit and walnut groves.
- **Pelso uplands:** orchards, vineyards and growing farms/estates.
- **Woodland edges and floodplains:** optional gathering of elderberries, sloes, cornelian cherries and hazelnuts.

## 9. Horses, cavalry and bows

### Horse breeding

The role is grounded in Roman provincial husbandry and military supply, not a modern Hungarian identity projected backwards. Finds indicate local and larger military horse populations; Aquincum–Albertfalva had a cavalry camp, and Pannonian auxiliary cavalry served elsewhere in the empire.

```text
Horse Pasture → Breeder → Training Paddock
 ├─ Riding Horses — Principes Household
 ├─ Draught Horses — cart, farming and logistics improvements
 └─ Military Horses + Tack — auxiliary cavalry
```

Tack workshops use established leather, bronze and iron production. An *ala* or *cohors equitata* would require horses, tack, woollen cloaks and weapons. Cavalry is an economic commitment, not a free cultural bonus.

### Bows and mounted archers

Distinguish locally made hunting/infantry bows from the frontier military traditions of the **Iazyges**, the Sarmatian neighbours east of the Danube. Iazygian mounted archers should not become generic Pannonian or “ancient Hungarian” units.

```text
Flexible Timber + Animal Sinew/Horn → Bowyer → Recurved Bow
```

The bow could equip infantry *sagittarii*. **Iazygian Horse Archers** would require a Danube trade/alliance agreement and consume riding horses plus bows. Their possible relationship with Rome under Trajan makes a basis for diplomatic late-game design, subject to historical review. Syrian sagittarii units documented later at Intercisa should not be starting units in AD 117.

Gameplay consequences:

- Larger dry pastures gain another purpose.
- Horses, sheep and pigs compete for land.
- Cavalry supports rapid frontier response and trade escorts.
- The far bank becomes a diplomatic space.
- Hunting bows support woodland production; mounted archers require expensive external relationships.

## 10. Four tier Marvels and the regional project

### Normal T3 Marvel pairs

- **Principes:** Sacred Precinct of Gorsium + Aquincum Spring and Bath District.
- **Decuriones:** Governor's Palace at Aquincum + Forum and Capitolium of Savaria.

Scarbantia remains essential through amber trade without needing its own Marvel. Brigetio anchors the larger military project rather than receiving a separate ordinary Marvel. Pelso provides economic/landscape specialisation.

### Ripa Pannonica — the Danube frontier system

A regional construction sequence across multiple locations:

```text
Limes Road and Milestones
 → Watchtowers and Signal Stations
 → Auxiliary Forts
 → River Harbours and Crossings
 → Granaries and Supply Stations
 → Brigetio Legionary Fortress
 → Aquincum Command and Logistics Centre
```

**Principes contribution:** grain, meat, woollen cloaks, baskets, timber, riding/draught horses and local workforce.

**Decuriones contribution:** bricks, iron goods, amphorae, writing tablets, money/tax revenue, engineering and administrative capacity.

Proposed completion rewards:

- Faster land and river transport.
- Greater harbour and warehouse capacity.
- Continuing imperial purchases of military products.
- Reduced raid and fire damage along the Danube.
- New commercial agreements with the Barbaricum and other provinces.
- Regional prestige and imperial favour.

The project integrates the mature regional economy rather than serving only as decoration.

## 11. Where new content is worth the work

Strong candidates for new/hybrid content:

1. Woven Baskets: wetland inputs serving households and logistics.
2. Civitas Sanctuary: regional cult choices.
3. Vicus Hall/Civitas Council House: institutions defining the local path.
4. Amber Jewellery: imported material and provincial craftsmanship.
5. Fruit Baskets and modular orchards: visual variety with a manageable resource system.
6. Horse breeding and auxiliary cavalry: civilian needs extending into military/logistics production.
7. Iazygian agreements and mounted archers: frontier diplomacy.
8. Aquincum Spring and Bath District: springworks, aqueduct and baths.
9. Ripa Pannonica: a distributed late-game project.

Avoid unnecessary new GUIDs or factories for porridge, fish, tunics, bread, garum, cheese, wine, wool, leather, pigs, sheep, grapes, sandals, togas, amphorae, writing tablets and glassware. Reuse regional clones of markets, baths, schools and forums where feasible.

## 12. Open checks before finalising the design

1. Base-game need GUIDs, supply-point values and category thresholds.
2. A cult list reviewed by place and date.
3. The starting chronology of Pannonian slipped ware in northern workshops.
4. AD 117 building phases for the four Marvels and the limits of alternate historical development.
5. Actual mod support for wetland-compatible roads and regional-context limits on river fishing.
6. Horse, tack and land-unit asset reuse.
7. Iazygian political relationships under Trajan and archaeological support for the bow recipe.
8. Site-specific chronology of apples, pears, plums, cherries, walnuts and peaches in northern Pannonia.

## 13. Research references

These references are retained from the working design's research notes; they are not a new verification pass.

- [Ubisoft: Optional Needs and supply points](https://www.anno-union.com/devblog-fulfil-needs-your-way/)
- [Ubisoft: Albion population paths and wetland economy](https://news.ubisoft.com/en-us/article/2E5rwI4XBSJFJjUzcBxU2x/anno-117-pax-romana--a-guide-to-albion-part-1)
- [Reed–Ožanić Roguljić: food, pottery and imperial imports](https://doi.org/10.1515/opar-2020-0105)
- [Aucissa fibulae in Pannonia](https://doi.org/10.1556/072.2023.00017)
- [The pottery industry of Aquincum's military town](https://www.researchgate.net/publication/351693566_Pottery_industry_of_the_Aquincum_military_town)
- [Amber Road, military presence and early ironworking](https://www.oeaw.ac.at/en/oeai/research/historical-archaeology/individual-research/amber-road-transit-route-and-military-presence)
- [Danube Limes](https://whc.unesco.org/en/list/1608/)
- [Aquincum's aqueduct and springs](https://doi.org/10.5195/ahea.2021.424)
- [Iazyges under Trajan](https://doi.org/10.1093/acrefore/9780199381135.013.3232)
- [Roman-period food plants in Pannonia — Hungarian](https://romaikor.hu/barbaricum_a_birodalom_hataran/taplalkozas_es_annak_novenyi_forrasai_pannoniaban_es_a_barbaricumban/cikk/taplaleknovenyek_maradvanyai_pannoniaban)
- [Roman landscapes and archaeobotany around Lake Balaton](https://doi.org/10.17204/dissarch.2025.563)

[Back to the Pannonia concept](README.md).
