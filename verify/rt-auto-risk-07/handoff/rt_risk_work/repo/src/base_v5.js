
const SEC=[["IT·소프트웨어",.048],["반도체",.052],["모빌리티",.044],["증권·핀테크",.038],["제약·바이오",.05],["에너지",.04],["소비재",.036],["미디어·게임",.05],["항공·물류",.037],["건설·부동산",.036],["통신",.034],["철강·소재",.037],["은행",.004],["보험",.004]];
const DB=`PNPL Pineapple|MCSF Macrosoft|ALPB Alphabit|ORCX Oraclo|ADBO Adobo|SLSF Salesforge|PLNT Palantier|SNWF Snowfall|CRWS CrowdStrife|NAVR 네이비어|KKAO 카카우|AMZE Amazone|METX Metaverse Platforms
NVDE Nvidea|AMDX Advanced Micros|INTL Intellect|QCMB Qualcomb|TSMX Tai-One Semi|AVGW Broadwave|ASMR ASMR Litho|ARMH Armhold|SSEC 삼송전자|SKHX 에스크하이닉스|MCRN Micronic|TXNS Texas Instrumentals
TSLR Tesler|FORX Fordham Motors|GMTR General Motorworks|TYMT Toyoda|HYDI 현다이모터스|KIAX 기아라|RVNX Rivianne|UBRX Ubero|LCDM Lucidium|BMWX Bayern Motoren|MRCD Mercedex|SNMT 쌍룡자동차
JPMX JPM Morgana|GSCH Goldman Sacks|BOAX Bank of Americana|CITX Citigrup|WFCX Wells Fargone|BRKB Berkshore Hathaway|VISR Visor|MSCD MasterCord|KBFN 케이비금융|SHFN 신환금융|HNFN 하나로금융|PYPL PayPaul
PFZR Pfizzer|JNJX Johnson&Jonson|MRCK Merc|LLYX Eli Lilium|ABBV AbbVee|NVSX Novartiz|RSHE Roshe Holdings|AMGM Amgem|CLTR 셀트리언|SBLX 삼송바이오|HNMI 한마음약품|MRNO Moderno
XOMX Exon Mobiel|CVXX Chevrone|SHLF Shelf Oil|BPXX Bee Petroleum|CNCP ConocoPhillip|NEXA NextEraa|ENFS Enfase Solar|SKIN 에스크이노베이션|GSCX 지에스칼텍|HNSL 한와솔라|OXYX Occidental Petro
WMTX Walmark|COSW Costcow|KOKX Coca-Colo|PEPS PepsiCola|MCDX McDonaldo|NKEX Nikee|SBKZ Starbuckz|PGXX Procter & Gambol|KUKG 쿠콩|LOTX 롯대쇼핑|OTGI 오뚝이식품|NSHM 농삼
NFLK Netflicks|DISN Disnee|EART Electronic Arch|ACTV Activisian|NCSF 엔시소프트|NXEN Nexen|KRFT 크래프턴|HYBX 하이부|SPTF Spotifly|RBLX Robloxx|TTWE Take-Twelve|CJEM 씨제이이엔엠
BOEG Boeng|LMTX Lockheel|AIRB Airbuss|UPZX UPZ Logistics|FDXP FedExpress|DALT Delta Airlinez|UNAL United Airlinez|KALX 대한하늘|HMMX 에이치엠해운|DHTO 대한통운|MERS Mersk Line
CATP Caterpiller|DEER John Deer|HDCX 현다이건설|SSCT 삼송물산|GSCN 지에스건설|DWCT 대우토건|PLGX Prologix|AMTW American Towers|ZILW Zillowe|LNRX Lennarr
VRZN Verizone|TMBL T-Mobil|ATNT AT&Tea|SKTX 에스크텔레콤|KTEL 케이티엔|LGUP 엘지유플|CMCS Comcastle|CHMB China Mobil|SFTB SoftBunk|DTEL Deutsche Telecomm
PSCO 포스크|NUKR Nukor Steel|ARCM ArcelorMetal|FRPT Freeporte Copper|ALBL Albemarl Lithium|DOWC Dowe Chemical|LGHW 엘지화확|SKCX 에스크씨|LNDE Lindee Gas|ALCH Alcoha|HYST 현다이제철|BASX BASS Chemie`.split("\n").map(r=>r.split("|").map(x=>{const k=x.indexOf(" ");return[x.slice(0,k),x.slice(k+1)]}));
const pl=s=>s.split("|").map(x=>{const k=x.indexOf(" ");return[x.slice(0,k),x.slice(k+1)]});
DB[3]=pl("GSCH Goldman Sacks|MSXX Morgan Stanlee|BLKR BlackRocket|VISR Visor|MSCD MasterCord|PYPL PayPaul|SQXX Squarr|COIN Coinbasis|ICEX Intercontinental Exch|CMEX CME Groupe|HOOD Robinhoodie|NHIS 한국투자증거|MIRA 미래애셋증권|NAMU 나무증권");
DB.push(pl("JPMX JPM Morgana|BOAX Bank of Americana|WFCX Wells Fargone|CITX Citigrup|KBFN 케이비금융|SHFN 신환금융|HNFN 하나로금융|WRFN 우릐금융|BNPX BNP Paribass|HSBX HSBZ Holdings|SANX Santandar|MUFX Mitsubishi UFJay"),pl("AIGX AIG Global Insure|MTLF MetLifeline|PRUD Prudentia|ALLZ Allianze|AXAX AXA Assurance|CHBB Chubbs|SMSL 삼송생명|HNHW 한와생명|KYBO 교보라이프|DBIN 디비손보|BRKR Berkshore Re|TRVL Travelerz"));
const KP=["한빛","미래","대성","한강","오션","코리아","청정","스카이","그린","동해","솔라","넥스트","태양","새봄","금성","백두","한울","누리","다온","은하","세종","대한","삼진","우리","하나","로얄","제일","북극성","동양","경남","호남","충청","영남","강원"];
const KS=[["시스템","소프트","데이터"],["반도체","칩스","테크"],["모터스","오토","모빌"],["캐피탈","증권","페이"],["제약","바이오","헬스"],["에너지","솔라","화학"],["푸드","유통","생활"],["게임즈","엔터","미디어"],["항공","로지스","해운"],["건설","개발","부동산"],["텔레콤","통신","네트웍스"],["철강","소재","금속"],["은행","저축은행","금융"],["생명","화재","손해보험"]];
const RV0=[["블랙록 캐피탈","idx"],["칼 아이콘","act"],["워렌 버팡","val"],["퀀텀 헤지","mom"]];
const TN=["대형","중형","소형"];
const AW=["Nova","Quantum","Hyper","Terra","Luna","Vertex","Zenith","Aero","Nano","Cyber","Astra","Pixel","Orbit","Fusion","Echo","Apex","Helix","Prism","Atlas","Neo","새봄","한울","다온","누리"];
const SB=[["Systems","Cloud","AI"],["Semi","Chips","Photonics"],["Motors","EV","Mobility"],["Capital","Pay","Bank"],["Bio","Therapeutics","Pharma"],["Energy","Solar","Power"],["Foods","Brands","Retail"],["Games","Studios","Media"],["Aero","Logistics","Freight"],["Build","Realty","Homes"],["Telecom","Networks","Wireless"],["Steel","Materials","Metals"],["Bank","Financial","Savings"],["Insurance","Assurance","Life"]];
