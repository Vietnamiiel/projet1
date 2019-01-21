$(document).ready(function(){
    document.querySelector("body").onload=function(){
        // Création de la map de Paris
        let map = new Microsoft.Maps.Map(document.getElementById('map'), {
            credentials: 'An7AbepgUPXvNd5eM6pvZR4COh5hlZdOM14MJ5oxrL4Y0VKQOR7G0xD2v_l9y8g6',
            center: new Microsoft.Maps.Location(48.85687514151293, 2.3336730342131773),
            mapTypeId: Microsoft.Maps.MapTypeId.road,
            zoom: 13,
        });
        //Récuperation du fichier JSON
        let JSONdata = $.get({
                url: "https://opendata.paris.fr/api/records/1.0/search/?dataset=parcs-de-stationnement-concedes-de-la-ville-de-paris&rows=200&facet=acces_vl&facet=arrdt&facet=deleg&facet=h_parc_cm&facet=type_parc&facet=horaire_na&facet=asc_surf&facet=acces_moto&facet=acces_velo&facet=v_elec_ch&facet=autopart&facet=tarif_pr&facet=tarif_res&facet=tf_pr_moto&facet=tf_res_mo&facet=parc_amod&facet=parc_relai&facet=nom_parc",
                cache: false,
                dataType: "json",
                success: function (response) {
                    addParkingOnMap (response);
                },
                error: function(){
                    alert("json not found");
                },
            }
        );
        //Creation d'une infobox non visible
        let infobox = new Microsoft.Maps.Infobox(map.getCenter(), {
            visible: false,
        });

        let Pins=[];
        let parkingData;
        function addParkingOnMap() {
            //On récupére ici les parkings
            parkingData = JSONdata.responseJSON.records;
            // Cette boucle permet de parcourir le fichier et de récupérer les données des parkings
            for (let i=0;i < parkingData.length;i++) {
                let coordonnee = parkingData[i]["geometry"]["coordinates"];
                let nomParking = parkingData[i]["fields"]["nom_parc"];
                let groupParking = parkingData[i]["fields"]["deleg"];
                let adressParking = parkingData[i]["fields"]["adress_geo"];
                let horaireParking = parkingData[i]["fields"]["horaire_na"];
                var accesMotoParking = parkingData[i]["fields"]["acces_moto"];
                var accesVeloParking = parkingData[i]["fields"]["acces_velo"];

                let location = new Microsoft.Maps.Location (coordonnee[1],coordonnee[0]);
                // On ajoute les marqueurs sur la map
                let pin = new Microsoft.Maps.Pushpin (location , {
                    icon: "Image/placeholder.png",
                });

                Pins.push(pin);

                // On ajoute des boutons abonnement et reservation a l'heure si dispo
                let parkingAbonnement=parkingData[i].fields.type_parc;
                if (parkingAbonnement==="VISITEURS ET ABONNES") {
                    parkingAbonnement="<br><button class='reservation_button' onclick=\"$('#abonne').modal()\">Abonnement</button>" +
                        "<button class='reservation_button' onclick=\"$('#unite').modal()\">Réservez à l'heure</button>";
                }
                else {
                    parkingAbonnement="<br><button class='reservation_button' onclick=\"$('#abonne').modal()\">Abonnement</button>" ;
                }
                //Ajout l'événement click sur les marqueurs
                Microsoft.Maps.Events.addHandler(pin, 'click', pinClicked);
                //Infobox data
                pin.metadata = {
                    title: "Parking " + groupParking + " " + nomParking,
                    description: adressParking +
                                 "<br> <u>horaires</u>: "+ horaireParking +
                                 "<br>"+ accesVeloMoto() +
                                 "<br>"+ parkingAbonnement,
                };
                map.entities.push(pin);
            }
            // On ajoute l'acces velo/moto à l'infobox
            function accesVeloMoto() {
                if ((accesMotoParking === "OUI")&&(accesVeloParking === "OUI")){
                    return "<u>Acces Motos</u>: OUI <br> <u>Acces Vélos</u>: OUI";
                }
                else if ((accesMotoParking ==="NON")&&(accesVeloParking === "OUI")){
                    return "<u>Acces Motos</u>: NON <br> <u>Acces Vélos</u>: OUI";
                }
                else if ((accesMotoParking ==="OUI")&&(accesVeloParking === "NON")){
                    return "<u>Acces Motos</u>: OUI <br> <u>Acces Vélos</u>: NON";
                }
                else {
                    return "";
                }
            }
        }
        //On ajoute une infobox à la map
        infobox.setMap(map);
        function pinClicked(e) {
            if (e.target.metadata) {
                infobox.setOptions({
                    maxWidth: 1000,
                    maxHeight: 1000,
                    location: e.target.getLocation(),
                    title: e.target.metadata.title,
                    description: e.target.metadata.description,
                    visible: true,
                });
                for (let i in Pins) {
                    if (Pins[i] === e.target) {
                        var index = i;
                    }
                }
                // On ajoute les diff tarifs aux modals de réservation si non vide
                // abonnements : Si prix = "ND" ou vide, on affiche pas checkbox
                let voiture1Mois = parkingData[index].fields.ab_1m_e;
                $('#choix5').css({display: (voiture1Mois === "ND" || voiture1Mois === "") ? "none" : ""});
                let voiture1An = parkingData[index].fields.ab_1a_e;
                $('#choix6').css({display: (voiture1An === "ND" || voiture1An === "") ? "none" : ""});
                let moto1Mois = parkingData[index].fields.abmoto_1me;
                $('#choix7').css({display: (moto1Mois === "ND" || moto1Mois === "") ? "none" : ""});
                let moto1An = parkingData[index].fields.abmoto_1ae;
                $('#choix8').css({display: (moto1An === "ND" || moto1An === "") ? "none" : ""});
                //affiche les prix Abonnement dans le tableau
                $('#voiture_1M').html(voiture1Mois);
                $('#voiture_1a').html(voiture1An);
                $('#moto_1M').html(moto1Mois);
                $('#moto_1a').html(moto1An);

                // Par heure : Si prix = "ND" ou vide, on affiche pas checkbox
                let voiture1Heure = parkingData[index].fields.tf_1h_e;
                $('#choix1').css({display: (voiture1Heure === "ND" || voiture1Heure === "") ? "none" : ""});
                let voiture24Heures = parkingData[index].fields.tf_24h_e;
                $('#choix2').css({display: (voiture24Heures === "ND" || voiture24Heures === "") ? "none" : ""});
                let moto30Minutes = parkingData[index].fields.tf_30mn_mo;
                $('#choix3').css({display: (moto30Minutes === "ND" || moto30Minutes === "") ? "none" : ""});
                let moto24Heures = parkingData[index].fields.tf_24h_mot;
                $('#choix4').css({display: (moto24Heures === "ND" || moto24Heures === "") ? "none" : ""});
                //affiche les prix à l'heure
                $('#voiture_1H').html(voiture1Heure);
                $('#voiture_24H').html(voiture24Heures);
                $("#moto_30mn").html(moto30Minutes);
                $("#moto_24H").html(moto24Heures);

                //Calcul le montant total des réservations souhaités
                $('.checkbox').click(function calculReservation() {
                    total = 0;
                    if ($('#choix1')[0].checked === true) {
                        total += parseFloat(voiture1Heure.replace(",", ".")); //Replace enlève la virgule pour mettre en float par la suite
                    }
                    if ($('#choix2')[0].checked === true) {
                        total += parseFloat(voiture24Heures.replace(",", "."));
                    }
                    if ($('#choix3')[0].checked === true) {
                        total += parseFloat(moto30Minutes.replace(",", "."));
                    }
                    if ($('#choix4')[0].checked === true) {
                        total += parseFloat(moto24Heures.replace(",", "."));
                    }
                    total2 = 0;
                    if ($('#choix5')[0].checked === true) {
                        total2 += parseFloat(voiture1Mois.replace(",", "."));
                    }
                    if ($('#choix6')[0].checked === true) {
                        total2 += parseFloat(voiture1An.replace(",", "."));
                    }
                    if ($('#choix7')[0].checked === true) {
                        total2 += parseFloat(moto1Mois.replace(",", "."));
                    }
                    if ($('#choix8')[0].checked === true) {
                        total2 += parseFloat(moto1An.replace(",", "."));
                    }
                    document.getElementById("total").innerHTML = total;
                    document.getElementById("total2").innerHTML = total2;
                });

                // Permet de mettre automatiquement la date du jour
                let today = new Date().toISOString().substr(0, 10);
                document.querySelector("#today").value = today;
                document.querySelector("#today2").value = today;

                // Permet de réinitialiser les modals a la fermeture
                $('#unite, #abonne').on('hidden.bs.modal', function () {
                    $(this).find("input[type=checkbox]").prop("checked", "").end();
                    document.getElementById("total").innerHTML = "";
                    document.getElementById("total2").innerHTML = "";
                });

                // Ouverture de la fenetre modale de recapitulatif
                $('.confirm_resa_button').click(function confirmBox() {
                    $('#unite').modal('hide');
                    $('#confirm_resa').modal('show');
                    let date = document.getElementById("today").value;
                    let time = document.getElementById("time").value;
                    $('#resa_date').html(date);
                    $('#resa_time').html(time);
                    $('#resa_prix').html(total);
                });
                $('.confirm_resa_button2').click(function confirmBox2() {
                    $('#abonne').modal('hide');
                $('#confirm_resa2').modal('show');
                    let date2 = document.getElementById("today2").value;
                    let time2 = document.getElementById("time2").value;
                    $('#resa_date2').html(date2);
                    $('#resa_time2').html(time2);
                    $('#resa_prix2').html(total2);
                });
            }
        }
    };
});










