import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, FileText, Shield, Phone } from 'lucide-react';

const AboutPage = () => {
  const menuItems = [
    { icon: <FileText className="w-5 h-5" />, label: 'About Shinee Trips', active: true },
    { icon: <Briefcase className="w-5 h-5" />, label: 'Careers', active: false },
    { icon: <FileText className="w-5 h-5" />, label: 'Terms & Condition', active: false },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy Policy', active: false },
    { icon: <Phone className="w-5 h-5" />, label: 'Contact Us', active: false }
  ];

  const teamMembers = [
    {
      name: 'John Green',
      title: 'Chief Product Officer',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      shortBio: 'John is kan horade är napuktiga genuskansjig. Nivåck attitydja i lasa kevis. Seminiss såkaken desstik. Jofuktig kongen bloppa dilogi. Sanera fuss. Ektig trist. Betårta plaska. Du kan vara drabbad.',
      longBio: 'Lorem ipsum ekujuska kottklister. Mobussa. Doson rosa, och gåv beling. Sung spengar nagelprotest och dins martad. Asm ambimatisk om anteledes. Cybersoldat lask vånar förutom makrobusm. Kusk autobygt för att tost och rengar. Prent desam och semid. Pås furésade tavla ut gogen melaktiga. Premir teratkiga att mikrotes ponysam. Bolundare preliga sobuns. Egod mårat i vill halmdocka. Douche plar ikluring, setösm. Hapls denom plus hask. Ber bynja. Var pseudogon. Suvis sesmisk tattling nyren sundotat. Sent diastat. Prenar asenar. Stalker suv, nybelt atöst dining. Postgyn son beherat. Googla budgetstup, stenogon, kvissfili. Nyhetsbok. Multigögt tor suprassa, resm.'
    },
    {
      name: 'Ross Geller',
      title: 'Chief Product Officer',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      shortBio: 'John is kan horade är napuktiga genuskansjig. Nivåck attitydja i lasa kevis. Seminiss såkaken desstik. Jofuktig kongen bloppa dilogi. Sanera fuss. Ektig trist. Betårta plaska. Du kan vara drabbad.',
      longBio: 'Lorem ipsum ekujuska kottklister. Mobussa. Doson rosa, och gåv beling. Sung spengar nagelprotest och dins martad. Asm ambimatisk om anteledes. Cybersoldat lask vånar förutom makrobusm. Kusk autobygt för att tost och rengar. Prent desam och semid. Pås furésade tavla ut gogen melaktiga. Premir teratkiga att mikrotes ponysam. Bolundare preliga sobuns. Egod mårat i vill halmdocka. Douche plar ikluring, setösm. Hapls denom plus hask. Ber bynja. Var pseudogon. Suvis sesmisk tattling nyren sundotat. Sent diastat. Prenar asenar. Stalker suv, nybelt atöst dining. Postgyn son beherat. Googla budgetstup, stenogon, kvissfili. Nyhetsbok. Multigögt tor suprassa, resm.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✉</span>
              <span>info@shineetrip.com</span>
            </div>
          </div>
          <div className="text-sm text-yellow-400">
            Himachal's Premier Luxury Travel Planner
          </div>
        </div>
      </header>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-6">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
         <div className="col-span-3">
  <Card className="border rounded-2xl">
    <CardContent className="p-0">

      {/* Header */}
      <div className="px-5 py-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">Profile</h2>
      </div>

      {/* Menu */}
      <div className="p-3 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all
              ${
                item.active
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>

    </CardContent>
  </Card>
</div>

          {/* Main Content Area */}
          <div className="col-span-9">
            {/* About Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">About Shinee Trips</h1>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Lorem ipsum genuskansjig olar. Becknarvåska åren mis tist. Hexavapresk kåde higon, liksom kalingar. Köl famisk stenoskapel.
                  Kade tröck-tv sönn ir geod. Tranostik inskädd, ade. Råkybebel hti os multibebel. Donyck megas rren. Årade fitransfòbi funt.
                  Bede mikägt. Krorat ultragön tilalades i posttos. Åfunade poligen. Fötonek ekogram gigartad. Far e-sport, spegicode. Prenas
                  fatt. Pidrangen bebåtr. Vise deskapet. Diska fibvård stengisk i prengen åheten. Dolägjt jerta att eling jehis utorn pumigon.
                  Gigabens ilıvis i legga inklusive posa dekabafan.
                </p>
                <p>
                  Bävis fekorade disode primåkrati. Ogen lagon om teklitga digifysisk. Pressom tingen, råk drins. Bel seren bevis. Bären jera ren i
                  dialir en din. Antel preliga, sedin dol. Decma interaktiv skrivalda rånade på larade. Bjudkaffe ode. Antilinar kvasigon deligl
                  reatingen. Kåv vytt, kottklister i beng. Du kan vara drabbaönade.
                </p>
              </div>
            </div>

            {/* Management Team Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Team</h2>
              <div className="space-y-8">
                {teamMembers.map((member, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {member.name}
                          </h3>
                          <p className="text-gray-500 text-sm mb-4">{member.title}</p>
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            {member.shortBio}
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {member.longBio}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;