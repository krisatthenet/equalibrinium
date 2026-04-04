import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const CookiePolicy = () => {
  return (
    <>
      <Helmet>
        <title>Slapukų politika - WorkBee</title>
        <meta name="description" content="Sužinokite, kaip WorkBee naudoja slapukus jūsų naršymo patirčiai gerinti." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-black">
        <Header />

        <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" asChild className="mb-8 -ml-4 text-muted-foreground hover:text-primary">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Grįžti į pagrindinį
              </Link>
            </Button>

            <div className="space-y-12">
              <section>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Slapukų politika</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Ši slapukų politika paaiškina, kas yra slapukai ir kaip mes juos naudojame „WorkBee“ platformoje. 
                  Prašome perskaityti šią politiką, kad suprastumėte, kokią informaciją renkame naudodami slapukus ir kaip ta informacija yra naudojama.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Cookie className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">Kas yra slapukai?</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Slapukai (angl. cookies) yra nedideli tekstiniai failai, kurie išsaugomi jūsų kompiuteryje ar mobiliajame įrenginyje, 
                  kai apsilankote interneto svetainėje. Jie leidžia svetainei prisiminti jūsų veiksmus ir parinktis 
                  (tokias kaip prisijungimo duomenys, kalba, šrifto dydis ir kitos rodymo parinktys) tam tikrą laiką, 
                  kad jums nereikėtų jų iš naujo įvesti kaskart grįžtant į svetainę ar naršant iš vieno puslapio į kitą.
                </p>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">Kaip mes naudojame slapukus?</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Mūsų platforma naudoja slapukus keliais skirtingais tikslais:
                </p>
                
                <div className="grid gap-6 mt-6">
                  <div className="bg-card/50 border border-border rounded-xl p-6">
                    <h3 className="text-xl font-medium mb-2 text-foreground">Būtinieji slapukai</h3>
                    <p className="text-muted-foreground">
                      Šie slapukai yra būtini, kad svetainė galėtų veikti, ir jų negalima išjungti mūsų sistemose. 
                      Jie paprastai nustatomi reaguojant į jūsų veiksmus, kurie prilygsta paslaugų prašymui, 
                      pavyzdžiui, privatumo nustatymų konfigūravimą, prisijungimą ar formų pildymą (pvz., vartotojo autentifikavimas ir sesijos valdymas).
                    </p>
                  </div>

                  <div className="bg-card/50 border border-border rounded-xl p-6">
                    <h3 className="text-xl font-medium mb-2 text-foreground">Funkciniai slapukai</h3>
                    <p className="text-muted-foreground">
                      Šie slapukai leidžia svetainei įsiminti jūsų pasirinkimus (pvz., jūsų vartotojo vardą, kalbą ar regioną, kuriame esate) 
                      ir pasiūlyti patobulintas, labiau asmeniniams poreikiams pritaikytas funkcijas.
                    </p>
                  </div>

                  <div className="bg-card/50 border border-border rounded-xl p-6">
                    <h3 className="text-xl font-medium mb-2 text-foreground">Analitiniai slapukai (Neprivalomi)</h3>
                    <p className="text-muted-foreground">
                      Šie slapukai padeda mums suprasti, kaip lankytojai sąveikauja su svetaine, rinkdami ir pranešdami informaciją anonimiškai. 
                      Tai padeda mums tobulinti platformos veikimą ir vartotojų patirtį.
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">Kaip valdyti slapukus?</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Jūs galite valdyti ir (arba) ištrinti slapukus pagal savo pageidavimus. Galite ištrinti visus jūsų kompiuteryje 
                  jau esančius slapukus, o daugumoje naršyklių galite nustatyti, kad slapukai nebūtų įrašomi. 
                  Tačiau tokiu atveju jums gali tekti rankiniu būdu koreguoti kai kurias parinktis kaskart apsilankius svetainėje, 
                  o kai kurios paslaugos ir funkcijos gali neveikti.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Daugiau informacijos apie tai, kaip valdyti slapukus populiariausiose naršyklėse, rasite naršyklių kūrėjų oficialiuose puslapiuose.
                </p>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CookiePolicy;