const missionlink = $('#mission_help').attr('href') || window.location.href.replace(/\?.*$/, "");
const missionID = missionlink.replace(/\?.*$/, "").match(/\d*$/)[0];

$.get(missionlink)
    .done(data => {
        data = $(data);

        let vehicleDefinitons = {
            truck: "消防車が",
            platform: "トラック",
            heavyRescue: "大型救助車",
            air: "aéreo",
            bchief: "消防隊",
            mcv: "vehículos de mando",
            tanker: "ウォータータンカー",
            hazmat: "危険物取扱車両が",
            police: "警察車両が",
            rth: "Helicóptero HSR",
            arff: "空港用消防車が",
            policeHeli: "Police Helicopter",
            ambulance: "Ambulancias"
        };

        let credits;
        let stations = {};
        let vehicles = {};
        let water;
        let poi;
        let prisonersMin = 0;
        let prisonersMax = 0;
        let patientsMin = 0;
        let patientsMax = 0;
        let nef = 0;
        let transport = 0;
        let specialisation;
        let tragehilfe = 0;
        let rth = 0;
        let special = {};
        let percentages = {};
        let expansions = [];
        let dauer;

        data.find(".col-md-4:nth-of-type(1) table tbody tr").each(function () {
            let content = $(this).text().trim();
            let number = $(this).find("td:last-of-type").text().trim().replace(/\D/g, "");
            if (content.match(/レジット/)) {
                credits = number;
            } else if (content.match(/必要|Requisito|Requisitos de/)) {
                stations[getStation(content)] = number;
            } else if (content.match(/レジット/)) {
                poi = getPOI(content);
            }
        });
        data.find(".col-md-4:nth-of-type(2) table tbody tr").each(function () {
            let content = $(this).text().trim();
            let number = $(this).find("td:last-of-type").text().trim().replace(/\D/g, "");
            if (content.match(/必要|necessárias|necessária/)) {
                vehicles[getVehicle(content)] = number;
            } else if (content.match(/確率/)) {
                percentages[getVehicle(content)] = number;
            }
        });
        data.find(".col-md-4:nth-of-type(3) table tbody tr").each(function () {
            let content = $(this).text().trim();
            let number = $(this).find("td:last-of-type").text().trim().replace(/\D/g, "");
            if (content.match(/最大患者/)) {
                patientsMax = number;
            } else if (content.match(/患者最低数/)) {
                patientsMin = number;
            } else if (content.match(/輸送/)) {
                transport = number;
            } else if (content.match(/NEF/)) {
                nef = number;
            } else if (content.match(/患者の専門性/)) {
                specialisation = $(this).find("td:last-of-type").text().trim();
            } else if (content.match(/囚人の最高数/)) {
                prisonersMax = number;
            } else if (content.match(/SWAT Personnel/)) {
                special["SWATPersonnel"] = number;
            } else if (content.match(/Duration/)) {
                dauer = $(this).find("td:last-of-type").text().trim();
            } else if (content.match(/拡張/)) {
                let expansionLinks = $(this).find("a");
                expansionLinks.each(function () {
                    expansions.push($(this).attr("href").replace(/\D/g, ""));
                });
            }
        });

        let mission = {
            name: data.find("h1").text().trim(),
            stations: stations
        };

        if (data.find(".col-md-4:nth-of-type(2) table tbody tr").length === 1) {
            mission.onlyRd = true;
            if (transport) {
                mission.transport = transport;
            }
            if (nef) {
                mission.nef = nef;
            }
            if (rth) {
                mission.rth = rth;
            }
            if (tragehilfe) {
                mission.tragehilfe = tragehilfe;
            }
            if (specialisation) {
                mission.specialisation = specialisation;
            }
        } else {
            mission.vehicles = vehicles;
            if (credits) {
                mission.credits = credits;
            }
            if (patientsMax > 0) {
                mission.patients = {
                    max: patientsMax
                };
                if (patientsMin > 0) {
                    mission.patients.min = patientsMin;
                }
                if (transport) {
                    mission.patients.transport = transport;
                }
                if (nef) {
                    mission.patients.nef = nef;
                }
                if (rth) {
                    mission.patients.rth = rth;
                }
                if (tragehilfe) {
                    mission.patients.tragehilfe = tragehilfe;
                }
                if (specialisation) {
                    mission.patients.specialisation = specialisation;
                }
            }
        }

        if (void 0 !== typeof poi) {
            mission.poi = poi;
        }

        if (water) {
            mission.water = water;
        }

        if (prisonersMax > 0) {
            mission.prisoners = {
                max: prisonersMax
            };
            if (prisonersMin > 0) {
                mission.prisoners.min = prisonersMin;
            }
        }

        for (let spec in special) {
            if (!mission.special) {
                mission.special = {};
            }
            mission.special[spec] = special[spec];
        }

        if (expansions) {
            mission.expansions = expansions;
        }

        if (percentages) {
            mission.percentages = percentages;
        }

        if (dauer) {
            mission.siwa = true;
            mission.dauer = dauer;
        }

        $.post(`${lssm.config.server}/modules/lss-missionHelper/writeMission.php`, {
            mission: mission,
            id: missionID,
            lang: "ja_JP"
        })
            .done(response => {
                if (response.startsWith('Error')) {
                    return console.error(`missionHelper Error:\n${response}`);
                }
                console.log(`Registered Missiontype ${missionID}`);
                let missionhelper_content = $(`#${LSSM_MH_PREFIX} .content`);
                if (!missionhelper_content[0]) return;
                missionhelper_content.append(response);
                lssm_missionhelper_adjustPosition();
            })
            .fail(reason => {
                console.error(reason);
            });

        function getPOI(content) {
            let pois = [
                "Parque",
                "Lago",
                "Hospital",
                "Floresta",
                "Ponto de ônibus",
                "Ponto de bonde",
                "Estação de trem \\(tráfego regional\\)",
                "Estação de trem \\(tráfego regional e viagem de longa distância\\)",
                "Estação de mercadorias",
                "Supermercado \\(pequeno\\)",
                "Supermercado \\(grande\\)",
                "Posto de combustível",
                "Escola",
                "Museu",
                "Shopping",
                "Oficina mecânica",
                "Saída de rodovia",
                "Mercado de natal",
                "Armazém",
                "Discoteca",
                "Estádio",
                "Fazenda",
                "Edifício comercial",
                "Piscina",
                "Railroad Crossing",
                "Teatro",
                "Feira",
                "Rio",
                "Aeroporto pequeno \\(pista\\)",
                "Aeroporto grande \\(pista\\)",
                "Terminal de aeroporto",
                "Banco",
                "Depósito",
                "Ponte",
                "Lanchonete de fast food",
                "Porto de carga",
                "Centro de reciclagem",
                "Arrancha-céus",
                "Doca de cruzeiro",
                "Marina",
                "Passagem de nível",
                "Túnel",
                "Armazém refrigerado",
                "Usina elétrica",
                "Fábrica",
                "Ferro velho",
                "Estação de metrô",
                "Tanque de armazenamento químico pequeno",
                "Tanque de armazenamento químico grande",
                "Hotel",
                "Bar",
                "Aterro sanitário",
                "Garagem de estacionamento"
            ];
            for (let i = 0; i < pois.length; i++) {
                if (content.match(pois[i])) {
                    return i;
                }
            }
        }

        function getStation(content) {
            let stationDefinitions = {
                0: "な消防署",
                2: "な救助ステーション",
                6: "警察ステーションが"
            };
            for (let station in stationDefinitions) {
                if (content.match(stationDefinitions[station])) {
                    return station;
                }
            }
        }

        function getVehicle(content) {
            for (let vehicle in vehicleDefinitons) {
                if (content.match(vehicleDefinitons[vehicle])) {
                    return vehicle;
                }
            }
        }
    });
