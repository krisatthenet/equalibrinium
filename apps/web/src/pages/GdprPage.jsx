import React from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const GdprPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageMeta
        title="BDAR politika - WorkBee"
        description="Sužinokite, kaip WorkBee tvarko jūsų asmens duomenis laikydamasi Bendrojo duomenų apsaugos reglamento (BDAR)."
      />

      <Header />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">BDAR politika</h1>
            <p className="text-muted-foreground">Versija 2.1 · Atnaujinta: 2026 m. gegužė</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              Ši BDAR politika aprašo, kaip WorkBee („mes", „mūsų" arba „mums") renka, naudoja ir saugo
              jūsų asmens duomenis pagal Bendrąjį duomenų apsaugos reglamentą (ES) 2016/679 („BDAR").
              Mes esame įsipareigoję užtikrinti jūsų asmens duomenų privatumą ir saugumą.
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Duomenų valdytojas</h2>
              <p className="text-muted-foreground mb-4">
                WorkBee valdo platformą adresu <strong className="text-foreground">workbee.space</strong>.
                BDAR tikslais WorkBee yra duomenų valdytojas, atsakingas už jūsų asmens duomenis.
              </p>
              <p className="text-muted-foreground">
                Dėl bet kokių duomenų apsaugos klausimų galite susisiekti su mumis:{' '}
                <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                  privacy@workbee.space
                </a>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Renkami asmens duomenys</h2>
              <p className="text-muted-foreground mb-4">
                Mes renkame ir tvarkome šių kategorijų asmens duomenis:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Tapatybės duomenys:</strong> vardas, vartotojo vardas, profilio nuotrauka</li>
                <li><strong className="text-foreground">Kontaktiniai duomenys:</strong> el. pašto adresas, telefono numeris, buvimo vieta</li>
                <li><strong className="text-foreground">Profilio duomenys:</strong> profesinė biografija, įgūdžiai, paslaugų kategorijos, socialinių tinklų nuorodos</li>
                <li><strong className="text-foreground">Sandorių duomenys:</strong> paslaugų užklausos, pasiūlymai, mokėjimo įrašai</li>
                <li><strong className="text-foreground">Komunikacijos duomenys:</strong> per platformą keičiamasi žinutės</li>
                <li><strong className="text-foreground">Naudojimo duomenys:</strong> lankyti puslapiai, naudotos funkcijos, laiko žymės, IP adresas, naršyklės tipas</li>
                <li><strong className="text-foreground">Atsiliepimų duomenys:</strong> platformoje pateikti įvertinimai ir atsiliepimai</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Mokėjimo kortelių duomenų mes nesaugome — juos tiesiogiai apdoroja mūsų PCI-DSS
                atitinkantis mokėjimo paslaugų teikėjas (Stripe).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Teisinis tvarkymo pagrindas</h2>
              <p className="text-muted-foreground mb-4">
                Asmens duomenis tvarkome tik turėdami teisėtą pagrindą. Remiamės šiais teisiniais pagrindais:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Sutarties vykdymas (6 str. 1 d. b p.):</strong> Tvarkymas
                  būtinas mūsų paslaugoms teikti — paskyros kūrimui, klientų ir rangovų derinimui,
                  mokėjimų ir komunikacijos užtikrinimui.
                </li>
                <li>
                  <strong className="text-foreground">Teisėti interesai (6 str. 1 d. f p.):</strong> Platformos
                  tobulinimas, sukčiavimo prevencija, saugumo užtikrinimas ir su paslaugomis susijusių
                  pranešimų siuntimas.
                </li>
                <li>
                  <strong className="text-foreground">Teisinė prievolė (6 str. 1 d. c p.):</strong> Atitiktis
                  taikomiems teisės aktams, įskaitant mokesčių, kovos su pinigų plovimu ir finansinius reglamentus.
                </li>
                <li>
                  <strong className="text-foreground">Sutikimas (6 str. 1 d. a p.):</strong> Rinkodaros el. laiškai ir
                  neesminiai slapukai — tik kai esate davę aiškų sutikimą, kurį galite bet kada atšaukti.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Kaip naudojame jūsų duomenis</h2>
              <p className="text-muted-foreground mb-4">Jūsų asmens duomenis naudojame, kad:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Sukurtume ir valdytume jūsų paskyrą bei profilį</li>
                <li>Suderintume klientus su tinkamais rangovais ir paslaugų teikėjais</li>
                <li>Apdorotume mokėjimus ir saugotume sandorių įrašus</li>
                <li>Įgalintume žinučių siuntimą tarp platformos naudotojų</li>
                <li>Siųstume operacinius pranešimus (rezervavimo patvirtinimus, mokėjimo kvitus, saugumo įspėjimus)</li>
                <li>Spręstume ginčus ir teiktume klientų aptarnavimą</li>
                <li>Aptiktume ir išvengtume sukčiavimo, piktnaudžiavimo ir saugumo incidentų</li>
                <li>Laikytumėmės teisinių ir reguliavimo prievolių</li>
                <li>Tobulintume ir individualizuotume platformos funkcijas pagal naudojimo modelius</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Duomenų saugojimo laikotarpiai</h2>
              <p className="text-muted-foreground mb-4">
                Asmens duomenis saugome tik tiek laiko, kiek būtina tikslams, dėl kurių jie buvo renkami,
                pasiekti, arba kiek reikalauja teisės aktai:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Paskyros duomenys:</strong> saugomi paskyros galiojimo laikotarpiu ir 30 dienų po ištrynimo (paskyros atkūrimui)</li>
                <li><strong className="text-foreground">Sandorių ir mokėjimų įrašai:</strong> saugomi 7 metus pagal mokesčių ir finansinius reglamentus</li>
                <li><strong className="text-foreground">Komunikacija:</strong> saugoma 2 metus po pokalbio pabaigos</li>
                <li><strong className="text-foreground">Naudojimo žurnalai:</strong> saugomi 12 mėnesių saugumo ir sukčiavimo prevencijos tikslais</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Duomenims nebereikalingais tapus jie saugiai ištriniami arba anonimizuojami.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Duomenų dalinimasis ir trečiosios šalys</h2>
              <p className="text-muted-foreground mb-4">
                Mes neparduodame jūsų asmens duomenų. Juos daliname tik šiais atvejais:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Paslaugų teikėjai:</strong> Stripe (mokėjimai), PocketBase
                  (duomenų bazės priegloba) ir el. pašto tiekėjai — visi susaistyti duomenų tvarkymo sutartimis.
                </li>
                <li>
                  <strong className="text-foreground">Tarp naudotojų:</strong> Profilio ir atsiliepimų duomenys
                  dalinami su kitais naudotojais kaip pagrindinė platformos funkcija.
                </li>
                <li>
                  <strong className="text-foreground">Analizė:</strong> Apibendrinti, anonimizuoti naudojimo duomenys
                  gali būti dalinami su analitikos teikėjais platformai tobulinti.
                </li>
                <li>
                  <strong className="text-foreground">Teisiniai reikalavimai:</strong> Kai to reikalauja teisės aktai,
                  teismo nutartis arba siekiant apsaugoti mūsų teises ir naudotojų saugumą.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Tarptautiniai duomenų perdavimai</h2>
              <p className="text-muted-foreground mb-4">
                Kai kurie mūsų paslaugų teikėjai gali tvarkyti duomenis už Europos ekonominės erdvės (EEE) ribų.
                Tokiais atvejais užtikriname, kad būtų taikomos tinkamos apsaugos priemonės, pavyzdžiui:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Europos Komisijos patvirtintos standartinės sutarčių sąlygos (SSS)</li>
                <li>Perdavimai į šalis, kurioms Europos Komisija yra priėmusi tinkamumo sprendimą</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Jūsų teisės pagal BDAR</h2>
              <p className="text-muted-foreground mb-4">
                Kaip duomenų subjektas pagal BDAR, jūs turite šias teises:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Teisė susipažinti (15 str.):</strong> Paprašyti mūsų
                  saugomų asmens duomenų kopijos.
                </li>
                <li>
                  <strong className="text-foreground">Teisė ištaisyti (16 str.):</strong> Prašyti ištaisyti
                  netikslius ar neišsamius duomenis.
                </li>
                <li>
                  <strong className="text-foreground">Teisė ištrinti (17 str.):</strong> Prašyti ištrinti
                  jūsų asmens duomenis („teisė būti pamirštam"), laikantis teisinio saugojimo prievolių.
                </li>
                <li>
                  <strong className="text-foreground">Teisė apriboti tvarkymą (18 str.):</strong> Prašyti,
                  kad tam tikromis aplinkybėmis apribotume duomenų tvarkymą.
                </li>
                <li>
                  <strong className="text-foreground">Teisė į duomenų perkeliamumą (20 str.):</strong> Gauti
                  duomenis struktūrizuotu, mašininiu būdu skaitomu formatu ir perduoti juos kitam valdytojui.
                </li>
                <li>
                  <strong className="text-foreground">Teisė nesutikti (21 str.):</strong> Nesutikti su
                  tvarkymu teisėtų interesų pagrindu arba tiesioginės rinkodaros tikslais.
                </li>
                <li>
                  <strong className="text-foreground">Teisės, susijusios su automatizuotu sprendimų priėmimu (22 str.):</strong>{' '}
                  Nebūti subjektu sprendimų, priimtų išimtinai automatizuoto tvarkymo pagrindu, kurie daro
                  reikšmingą poveikį.
                </li>
                <li>
                  <strong className="text-foreground">Teisė atšaukti sutikimą:</strong> Kai tvarkymas grindžiamas
                  sutikimu, galite jį bet kada atšaukti, tai neturės įtakos ankstesnio tvarkymo teisėtumui.
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Norėdami pasinaudoti bet kuria iš šių teisių, susisiekite su mumis:{' '}
                <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                  privacy@workbee.space
                </a>
                . Atsakysime per 30 dienų. Daugelį nuostatų taip pat galite valdyti tiesiogiai{' '}
                <Link to="/settings" className="text-primary hover:underline">
                  paskyros nustatymuose
                </Link>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Slapukai</h2>
              <p className="text-muted-foreground mb-4">
                Mes naudojame slapukus ir panašias technologijas platformai valdyti ir, gavę jūsų
                sutikimą, naudojimui analizuoti. Išsamią informaciją apie tai, kokius slapukus naudojame,
                jų paskirtį ir kaip valdyti nuostatas, rasite mūsų{' '}
                <Link to="/cookie-policy" className="text-primary hover:underline">
                  Slapukų politikoje
                </Link>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Duomenų saugumas</h2>
              <p className="text-muted-foreground mb-4">
                Įgyvendiname tinkamas technines ir organizacines priemones jūsų asmens duomenims apsaugoti
                nuo neteisėtos prieigos, atsitiktinio praradimo, sunaikinimo ar sugadinimo. Tai apima
                šifruotą duomenų saugojimą, TLS ryšio šifravimą, prieigos kontrolę ir reguliarius saugumo auditus.
              </p>
              <p className="text-muted-foreground">
                Įvykus duomenų saugumo pažeidimui, dėl kurio gali kilti pavojus jūsų teisėms ir laisvėms,
                pranešime kompetentingai priežiūros institucijai per 72 valandas ir, kur reikalaujama,
                informuosime jus tiesiogiai.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Teisė pateikti skundą</h2>
              <p className="text-muted-foreground mb-4">
                Jei manote, kad mes tinkamai netvarkome jūsų asmens duomenų pagal BDAR, turite teisę
                pateikti skundą priežiūros institucijai savo ES valstybėje narėje.
                Lietuvos naudotojams kompetentinga institucija yra:
              </p>
              <address className="text-muted-foreground not-italic mb-4 pl-4 border-l-2 border-border">
                Valstybinė duomenų apsaugos inspekcija (VDAI)<br />
                L. Sapiegos g. 17, LT-10312 Vilnius, Lietuva<br />
                <a href="https://vdai.lrv.lt" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  vdai.lrv.lt
                </a>
              </address>
              <p className="text-muted-foreground">
                Pirmiausia rekomenduojame susisiekti su mumis{' '}
                <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                  privacy@workbee.space
                </a>
                {' '}— taip galėsime išspręsti jūsų problemą tiesiogiai.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Šios politikos pakeitimai</h2>
              <p className="text-muted-foreground mb-4">
                Šią BDAR politiką galime periodiškai atnaujinti. Atlikę esminius pakeitimus, informuosime
                jus el. paštu arba paskelbsime ryškų pranešimą platformoje prieš pakeitimams įsigaliojant.
                Puslapio viršuje nurodytas „Atnaujinimo" laukas rodo, kada politika buvo paskutinį kartą keista.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Susisiekite su mumis</h2>
              <p className="text-muted-foreground mb-4">
                Dėl bet kokių klausimų ar prašymų, susijusių su šia BDAR politika ar mūsų duomenų tvarkymo
                praktika, kreipkitės:
              </p>
              <ul className="list-none pl-0 text-muted-foreground space-y-1">
                <li>
                  <strong className="text-foreground">El. paštas:</strong>{' '}
                  <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                    privacy@workbee.space
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">Svetainė:</strong>{' '}
                  <Link to="/contact" className="text-primary hover:underline">
                    workbee.space/contact
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GdprPage;
