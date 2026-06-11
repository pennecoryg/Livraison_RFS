//------------------------------------------------------------------------------//
//-------------------------------------DATA-------------------------------------//
//------------------------------------------------------------------------------//

let data_RFSLoaded = false;
let data_RFS = [];

async function chargerDonnees() {
  try {
    const response = await fetch("dataMO.json");
    const data = await response.json();
    console.log(data); 
    
    const colonnesMinuscules = ["Pris en charge (maintenance)"];
    data_RFS = data.RFS.map(row => {
      let obj = {};
      
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim();
        
        let valeur = String(row[key] || "")
          .replace(/\r/g, "")
          .trim();

        if (!colonnesMinuscules.includes(key)) {
          valeur = valeur.toUpperCase();
        }
        obj[cleanKey] = valeur;
      });

      
      // Transformation du format pilote : prenom.nom@airbus.com ou prenom.nom.external@airbus.com → Prenom Nom
      const pilote = obj["Pris en charge (maintenance)"] || "";
      const regexPilote = /^([a-zA-ZÀ-ÿ-]+)\.([a-zA-ZÀ-ÿ-]+)(\.external)?@airbus\.com$/i;
      const match = pilote.match(regexPilote);
      if (match) {
        const prenom = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const nom = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
        obj["Pris en charge (maintenance)"] = `${prenom} ${nom}`;
      }

      return obj;
    }).filter(row => {
      const statut = row["Statut de la RFS"] || "";
      const pilote = row["Pris en charge (maintenance)"] || "";

      const statutOK = statut !== "CLOTURÉE" && statut !== "ANNULÉE" && statut !== "REFUSÉE";
      const piloteOK = pilote !== "Frederic Blandel" && pilote !== "Mickael Monnier" && pilote !== "SALLE, Michaël";

      return statutOK && piloteOK;
    });
    
    console.log(Object.keys(data_RFS[0]))
    
    data_RFSLoaded = true;
    console.log("Fichier RFS chargé :", data_RFS);

  } catch (error) {
    console.error("Erreur chargement JSON :", error);
  }
}

chargerDonnees().then(() => {

  // ✅ Maintenant les données sont chargées, on peut remplir les datalists

  function mettreAJourDatalist(lignesFiltrees) {
    // RFS
    const RFS_disp = [...new Set(lignesFiltrees.map(item => item["Numéro de la RFS"]))].filter(m => m).sort();
    const RFSDatalist = document.getElementById("RFSList");
    RFSDatalist.innerHTML = "";
    RFS_disp.forEach(RFS => {
      const option = document.createElement("option");
      option.value = RFS;
      RFSDatalist.appendChild(option);
    });

    // Date RFS
    const DateRFS_disp = [...new Set(lignesFiltrees.map(item => {
      return getSemaineISOAvecAnnee(item["Date de la demande"]);
    }))].filter(m => m).sort((a, b) => {
      const [sA, yA] = a.split("-").map(Number);
      const [sB, yB] = b.split("-").map(Number);
      return yA !== yB ? yA - yB : sA - sB;
    });
    const DateRFSDatalist = document.getElementById("DateRFSList");
    DateRFSDatalist.innerHTML = "";
    DateRFS_disp.forEach(s => {
      const option = document.createElement("option");
      option.value = s;
      DateRFSDatalist.appendChild(option);
    });

    // Statuts
    const Statut_disp = [...new Set(lignesFiltrees.map(item => item["Statut de la RFS"]))].filter(m => m).sort();
    const StatutDatalist = document.getElementById("StatutList");
    StatutDatalist.innerHTML = "";
    Statut_disp.forEach(Statut => {
      const option = document.createElement("option");
      option.value = Statut;
      StatutDatalist.appendChild(option);
    });

    // Semaines livraison théorique
    const SemaineLivrTh_disp = [...new Set(lignesFiltrees.map(item => {
      const g = selectGrpLivraison(item);
      return getSemaineISOAvecAnnee(item[`Livraison théorique (fournisseur) [${g}]`]);
    }))].filter(m => m).sort((a, b) => {
      const [sA, yA] = a.split("-").map(Number);
      const [sB, yB] = b.split("-").map(Number);
      return yA !== yB ? yA - yB : sA - sB;
    });
    const SemaineLivrThDatalist = document.getElementById("SemaineLivrThList");
    SemaineLivrThDatalist.innerHTML = "";
    SemaineLivrTh_disp.forEach(s => {
      const option = document.createElement("option");
      option.value = s;
      SemaineLivrThDatalist.appendChild(option);
    });

    // Semaines délai maintenance
    const SemaineDelaiMaintenance_disp = [...new Set(lignesFiltrees.map(item => {
      const g = selectGrpLivraison(item);
      return getSemaineISOAvecAnnee(item[`Délai estimé maintenance [${g}]`]);
    }))].filter(m => m).sort((a, b) => {
      const [sA, yA] = a.split("-").map(Number);
      const [sB, yB] = b.split("-").map(Number);
      return yA !== yB ? yA - yB : sA - sB;
    });
    const SemaineDelaiMaintenanceDatalist = document.getElementById("SemaineDelaiMaintenanceList");
    SemaineDelaiMaintenanceDatalist.innerHTML = "";
    SemaineDelaiMaintenance_disp.forEach(s => {
      const option = document.createElement("option");
      option.value = s;
      SemaineDelaiMaintenanceDatalist.appendChild(option);
    });

    // Fournisseurs
    const fournisseur_disp = [...new Set(lignesFiltrees.map(item => {
      const g = selectGrpFournisseur(item);
      return item[`Fournisseur [${g}]`];
    }))].filter(m => m).sort();
    const FournisseurDatalist = document.getElementById("FournisseurList");
    FournisseurDatalist.innerHTML = "";
    fournisseur_disp.forEach(f => {
      const option = document.createElement("option");
      option.value = f;
      FournisseurDatalist.appendChild(option);
    });

    // Pilote
    const Pilote_disp = [...new Set(lignesFiltrees.map(item => item["Pris en charge (maintenance)"]))].filter(m => m).sort();
    const PiloteDatalist = document.getElementById("PiloteList");
    PiloteDatalist.innerHTML = "";
    Pilote_disp.forEach(RFS => {
      const option = document.createElement("option");
      option.value = RFS;
      PiloteDatalist.appendChild(option);
    });
  }


  //--------------------------------------------------------------------------------//
  //------------------------------------Variables-----------------------------------//
  //--------------------------------------------------------------------------------//

  // On récupère les éléments HTML par leur ID
  const inputRFS = document.getElementById("inputRFS");
  const inputDateRFS = document.getElementById("inputDateRFS");
  const inputStatut = document.getElementById("inputStatut");
  const inputSemaineLivrTh = document.getElementById("inputSemaineLivrTh");
  const inputSemaineDelaiMaintenance = document.getElementById("inputSemaineDelaiMaintenance");
  const inputfournisseur = document.getElementById("inputFournisseur");
  const inputPilote = document.getElementById("inputPilote");
  const btnValider = document.getElementById("btnValider");
  const btnEffacer = document.getElementById("btnEffacer");


  //-------------------------------------------------------------------------------//
  //--------------------------------------Main-------------------------------------//
  //-------------------------------------------------------------------------------//
  remplirTableau();
  
  btnEffacer.onclick = function () {
    inputRFS.value = "";
    inputDateRFS.value = "";
    inputStatut.value = "";
    inputSemaineLivrTh.value = "";
    inputSemaineDelaiMaintenance.value = "";
    inputfournisseur.value = "";
    inputPilote.value = "";
    remplirTableau();
    }

  function lancerRemplissage() {
    remplirTableau();
  }

  // Première condition du lancement de remplissage de tableau avec bouton valider
  btnValider.onclick = lancerRemplissage;


  // Deuxième condition du lancement de remplissage de tableau avec touche entrer
  [inputRFS, inputDateRFS, inputStatut, inputSemaineLivrTh, inputSemaineDelaiMaintenance, inputfournisseur, inputPilote].forEach(input => {
    input.addEventListener("keydown", function (e) {if (e.key === "Enter") {lancerRemplissage();}
    });
  });

  
  function excelDateVersDate(serial) {
    if (!serial) return "";
    if (!isNaN(serial)) {
        const date = new Date((Number(serial) - 25569) * 86400 * 1000);
        return date.toLocaleDateString("fr-FR");
    }
    return serial;
  }


  function excelDateHeureVersDate(serial) {
    if (!serial) return "";
    if (!isNaN(serial)) {
        const date = new Date((Number(serial) - 25569) * 86400 * 1000);
        const heures = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return date.toLocaleDateString("fr-FR") + " " + heures + ":" + minutes;
    }
    return serial;
  }


  // Fonction pour les datalist pour pouvoir avoir le numéro de la semaine avec l'année plutot qu'une date complète
  function getSemaineISOAvecAnnee(dateStr) {
    if (!dateStr) return null;
    let date;
    if (!isNaN(dateStr)) {
      date = new Date((Number(dateStr) - 25569) * 86400 * 1000);
    } else if (dateStr.includes("/")) {
      const [jour, mois, annee] = dateStr.split("/");
      date = new Date(Date.UTC(Number(annee), Number(mois) - 1, Number(jour)));
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date)) return null;
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const anneeISO = tmp.getUTCFullYear();
    const debut = new Date(Date.UTC(anneeISO, 0, 1));
    const semaine = Math.ceil((((tmp - debut) / 86400000) + 1) / 7);
    return `${semaine}-${anneeISO}`;
  }


  // Fonction pour sélectionner les groupes d'infos à prendre en compte
  function selectGrpPanier(ligne) {
    const lettres = ["e", "d", "c", "b", "a"];
    
    for (const lettre of lettres) {
      const panier   = ligne[`N°panier/DA [${lettre}]`] || "";
      const commande = ligne[`N°commande [${lettre}]`] || "";
      const dateCreation = ligne[`Date création panier [${lettre}]`] || "";
      const dateCommande = ligne[`Date de la commande [${lettre}]`] || "";
      
      if (panier || commande || dateCreation || dateCommande) {
        return lettre;
      }
    }
    return "a"; // fallback
  }

  function selectGrpLivraison(ligne) {
    const lettres = ["e", "d", "c", "b", "a"];
    
    for (const lettre of lettres) {
      const livrTh    = ligne[`Livraison théorique (fournisseur) [${lettre}]`] || "";
      const livrReelle = ligne[`Date livraison réelle (fournisseur) [${lettre}]`] || "";
      const delaiMaint = ligne[`Délai estimé maintenance [${lettre}]`] || "";
      
      if (livrTh || livrReelle || delaiMaint) {
        return lettre;
      }
    }
    return "a"; // fallback
  }

  function selectGrpFournisseur(ligne) {
    const lettres = ["e", "d", "c", "b", "a"];
    
    for (const lettre of lettres) {
      const fournisseur = ligne[`Fournisseur [${lettre}]`] || "";
      if (fournisseur) return lettre;
    }
    return "a";
  }


  function remplirTableau() {
    const tbody = document.getElementById("resultsTableau");
    tbody.innerHTML = "";

    const valeursRenseignees = {
        RFS:                        inputRFS.value.trim().toUpperCase(),
        DateRFS:                    inputDateRFS.value.trim().toUpperCase(),
        Statut:                     inputStatut.value.trim().toUpperCase(),
        SemaineLivrTh:              inputSemaineLivrTh.value.trim().toUpperCase(),
        SemaineDelaiMaintenance:    inputSemaineDelaiMaintenance.value.trim().toUpperCase(),
        fournisseur:                inputfournisseur.value.trim().toUpperCase(),
        Pilote:                     inputPilote.value.trim().toUpperCase(),
    };

    // Correspondance entre les clés et les colonnes du JSON
    const correspondance = {
        RFS:                        "Numéro de la RFS",
        DateRFS:                    "Date de la demande",
        Statut:                     "Statut de la RFS",
        SemaineLivrTh:              "Livraison théorique (fournisseur) [a]",
        SemaineDelaiMaintenance:    "Délai estimé maintenance [a]",
        fournisseur:                "Fournisseur [a]",
        Pilote:                     "Pris en charge (maintenance)",
        };

    // Filtrage
    const lignesFiltrees = data_RFS.filter(row => {
        return Object.entries(valeursRenseignees).every(([cle, val]) => {
        if (!val) return true;
        if (cle === "RFS") {
          const valeurLigneRFS = row[correspondance[cle]] || "";
          return valeurLigneRFS.includes(val);
        }

        if (cle === "DateRFS") {
          const val_ligne = row["Date de la demande"] || "";
          const semaine = getSemaineISOAvecAnnee(val_ligne);
          return semaine !== null && String(semaine) === val;
        }

        if (cle === "Statut") {
          const valeurLigneStatut = row[correspondance[cle]] || "";
          return valeurLigneStatut.includes(val);
        }
        
        if (cle === "SemaineLivrTh") {
          const groupeLivraison = selectGrpLivraison(row);
          const val_ligne = row[`Livraison théorique (fournisseur) [${groupeLivraison}]`] || "";
          const semaine = getSemaineISOAvecAnnee(val_ligne);
          return semaine !== null && String(semaine) === val;
        }

        if (cle === "SemaineDelaiMaintenance") {
          const groupeLivraison = selectGrpLivraison(row);
          const val_ligne = row[`Délai estimé maintenance [${groupeLivraison}]`] || "";
          const semaine = getSemaineISOAvecAnnee(val_ligne);
          return semaine !== null && String(semaine) === val;
        }


        if (cle === "fournisseur") {
          const groupeFournisseur = selectGrpFournisseur(row);
          const valeurLigneFournisseur = row[`Fournisseur [${groupeFournisseur}]`] || "";
          return valeurLigneFournisseur.includes(val) ;
        }

        if (cle === "Pilote") {
          const valeurLignePilote = (row[correspondance[cle]] || "").toUpperCase();
          return valeurLignePilote.includes(val);
        }
        
        return row[correspondance[cle]]?.includes(val);
        });
    })

    mettreAJourDatalist(lignesFiltrees);

    lignesFiltrees.sort((a, b) => {
      const dateA = Number(a["Date de la demande"]) || 0;
      const dateB = Number(b["Date de la demande"]) || 0;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;  // a sans date → en bas
      if (!dateB) return -1; // b sans date → en bas
      return dateA - dateB;
    });

    // Remplissage du tableau
    lignesFiltrees.forEach(row => {
        const tr = document.createElement("tr");
        const groupePanier = selectGrpPanier(row); // ← on détecte le bon groupe
        const groupeLivraison = selectGrpLivraison(row);
        const groupeFournisseur = selectGrpFournisseur(row);
        
        tr.innerHTML = `
            <td>${row["Numéro de la RFS"] || ""}</td>
            <td>${row["Pris en charge (maintenance)"] || ""}</td>
            <td>${excelDateHeureVersDate(row["Date de la demande"]) || ""}</td>
            <td>${row[`N°panier/DA [${groupePanier}]`] || ""}</td>
            <td>${excelDateHeureVersDate(row[`Date création panier [${groupePanier}]`]) || ""}</td>
            <td>${row[`N°commande [${groupePanier}]`] || ""}</td>
            <td>${excelDateHeureVersDate(row[`Date de la commande [${groupePanier}]`])|| ""}</td>
            <td>${excelDateHeureVersDate(row[`Livraison théorique (fournisseur) [${groupeLivraison}]`])|| ""}</td>
            <td>${excelDateHeureVersDate(row[`Date livraison réelle (fournisseur) [${groupeLivraison}]`])|| ""}</td>
            <td>${excelDateHeureVersDate(row[`Délai estimé maintenance [${groupeLivraison}]`])|| ""}</td>
            <td>${row[`Fournisseur [${groupeFournisseur}]`] || ""}</td>  
            <td>${row["N°famille [a]"] || ""}</td>
            <td>${row["Quantité [a]"] || ""}</td>
        `;
        // Coloration selon la date de livraison théorique
        const livrReelle = row[`Date livraison réelle (fournisseur) [${groupeLivraison}]`] || "";
        const livrTh = row[`Livraison théorique (fournisseur) [${groupeLivraison}]`] || "";

        if (!livrReelle && livrTh) {
          const aujourd_hui = new Date();
          aujourd_hui.setHours(0, 0, 0, 0);
          const dateLivrTh = new Date((Number(livrTh) - 25569) * 86400 * 1000);
          dateLivrTh.setHours(0, 0, 0, 0);
          const diffJours = (dateLivrTh - aujourd_hui) / (1000 * 60 * 60 * 24);

          if (diffJours <= 0) {
            tr.style.backgroundColor = "#FF3E61";
            tr.style.color = "white";
          } else if (diffJours <= 7) {
            tr.style.backgroundColor = "#FFA995";
            tr.style.color = "white";
          }
        }

        tbody.appendChild(tr);
    });
}

})

