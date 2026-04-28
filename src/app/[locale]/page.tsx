import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import AtAGlance from "@/components/AtAGlance";
import SystemsDocs from "@/components/SystemsDocs";
import Story from "@/components/Story";
import ContactSection from "@/components/ContactSection";
import ChatWrapper from "@/components/ChatWrapper";
import { getHeroImages, getGalleryImages } from "@/lib/images";
import { getVehicleData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const heroImages = getHeroImages();
  const galleryImages = getGalleryImages();
  const vehicleData = await getVehicleData();

  return (
    <>
      <Navbar />
      <main>
        <Hero
          images={heroImages}
          seller={vehicleData.seller}
          price={vehicleData.vehicle?.price}
        />
        <Gallery images={galleryImages} />
        <AtAGlance vehicleData={vehicleData} />
        <SystemsDocs vehicleData={vehicleData} />
        <Story vehicleData={vehicleData} />
        <ContactSection seller={vehicleData.seller} />
      </main>
      <footer className="bg-ocean-950 text-ocean-600 text-center py-6 text-sm">
        <p>Doris — 2019 Citroën Jumper H2L2</p>
      </footer>
      <ChatWrapper />
    </>
  );
}
