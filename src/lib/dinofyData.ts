// DinoFy: breed → dinosaur mapping + dino metadata
export type DinoKey =
  | 'TRex' | 'Velociraptor' | 'Brachiosaurus' | 'Triceratops' | 'Stegosaurus'
  | 'Ankylosaurus' | 'Compsognathus' | 'Carnotaurus' | 'Dilophosaurus'
  | 'Pteranodon' | 'Quetzalcoatlus' | 'Microraptor' | 'Protoceratops'
  | 'Parasaurolophus' | 'Pachycephalosaurus' | 'Allosaurus' | 'Gallimimus'
  | 'Diplodocus' | 'Mosasaurus' | 'Plesiosaurus' | 'Spinosaurus'
  | 'Iguanodon' | 'Troodon' | 'Anchiornis' | 'Archaeopteryx';

export interface Dino {
  name: string;
  emoji: string;
  traits: string[];
  description: string;
  promptSuffix: string;
}

export const DINOS: Record<DinoKey, Dino> = {
  TRex: { name: 'T-Rex', emoji: '🦖', traits: ['Apex Predator','Dominant','Fearless','Commands Respect'], description: 'The undisputed ruler of the Cretaceous.', promptSuffix: 'Tyrannosaurus Rex, photorealistic, 8k, cinematic dramatic lighting, powerful stance, scales glistening, National Geographic quality, solo portrait' },
  Velociraptor: { name: 'Velociraptor', emoji: '🦖', traits: ['Lightning Fast','Razor Sharp','Strategic','Intense'], description: 'Cunning, agile, always three steps ahead.', promptSuffix: 'Velociraptor, photorealistic, feathered scales, alert hunting pose, intelligent eyes, 8k, cinematic lighting' },
  Brachiosaurus: { name: 'Brachiosaurus', emoji: '🦕', traits: ['Gentle Giant','Patient','Towering Grace','Peaceful'], description: 'Enormous heart, infinite gentleness.', promptSuffix: 'Brachiosaurus, photorealistic, gentle giant, lush prehistoric jungle, golden hour lighting, 8k' },
  Triceratops: { name: 'Triceratops', emoji: '🦕', traits: ['Loyal Guardian','Protective','Good-Natured','Steadfast'], description: 'Three horns, one giant heart.', promptSuffix: 'Triceratops, photorealistic, noble stance, detailed horn texture, lush fern background, 8k' },
  Stegosaurus: { name: 'Stegosaurus', emoji: '🦕', traits: ['Quirky','Armored','Low-Key','Mysterious'], description: 'Unconventional and impossible to read.', promptSuffix: 'Stegosaurus, photorealistic, detailed dorsal plates, prehistoric landscape, soft golden lighting, 8k' },
  Ankylosaurus: { name: 'Ankylosaurus', emoji: '🦕', traits: ['Independent','Armored Soul','Immovable','Self-Sufficient'], description: 'Built like a fortress. Secretly loves you.', promptSuffix: 'Ankylosaurus, photorealistic, heavily armored bony plates, club tail, moody prehistoric atmosphere, 8k' },
  Compsognathus: { name: 'Compsognathus', emoji: '🦖', traits: ['Small But Fierce','Lightning Quick','Feisty','Underestimated'], description: 'Tiny. Terrifying. Confidence of a creature 100x its size.', promptSuffix: 'Compsognathus, photorealistic, tiny feathered dinosaur, fierce alert expression, lush jungle, 8k' },
  Carnotaurus: { name: 'Carnotaurus', emoji: '🦖', traits: ['Wild','Unpredictable','Primal','Magnetic'], description: 'Most dramatic dino in the room.', promptSuffix: 'Carnotaurus, photorealistic, bull horns, powerful muscular body, volcanic landscape, 8k' },
  Dilophosaurus: { name: 'Dilophosaurus', emoji: '🦖', traits: ['Vocal','Showy','Opinionated','Expressive'], description: 'Has a lot to say and will say it loudly.', promptSuffix: 'Dilophosaurus, photorealistic, colorful twin crests, expressive pose, vibrant jungle, 8k' },
  Pteranodon: { name: 'Pteranodon', emoji: '🦅', traits: ['Free Spirit','Theatrical','Dramatic','Elevated'], description: 'Born to soar above it all.', promptSuffix: 'Pteranodon, photorealistic, dramatic wingspan, stormy sky, cinematic aerial shot, 8k' },
  Quetzalcoatlus: { name: 'Quetzalcoatlus', emoji: '🦅', traits: ['Regal','Commanding','Ancient Wisdom','Colossal'], description: 'Largest flying creature in history. Always built different.', promptSuffix: 'Quetzalcoatlus, photorealistic, massive wingspan, regal standing pose, dramatic sunset, 8k' },
  Microraptor: { name: 'Microraptor', emoji: '🦅', traits: ['Quick','Nimble','Clever','Four-Winged Wonder'], description: 'Four wings, infinite attitude.', promptSuffix: 'Microraptor, photorealistic, four iridescent wings, gliding through prehistoric forest, 8k' },
  Protoceratops: { name: 'Protoceratops', emoji: '🦕', traits: ['Gentle','Social','Timid','Pure-Hearted'], description: 'The original bunny dinosaur.', promptSuffix: 'Protoceratops, photorealistic, small gentle frill, Mongolian desert landscape, 8k' },
  Parasaurolophus: { name: 'Parasaurolophus', emoji: '🦕', traits: ['Serene','Musical','Herd Soul','Communicative'], description: 'Peaceful and deeply communicative.', promptSuffix: 'Parasaurolophus, photorealistic, elegant hollow crest, peaceful riverside habitat, 8k' },
  Pachycephalosaurus: { name: 'Pachycephalosaurus', emoji: '🦕', traits: ['Headstrong','Resilient','Determined','Never Backs Down'], description: 'Most hard-headed creature to exist.', promptSuffix: 'Pachycephalosaurus, photorealistic, dramatic dome head, rocky highland terrain, 8k' },
  Allosaurus: { name: 'Allosaurus', emoji: '🦖', traits: ['Formidable','Noble','Stealthy','Commands Awe'], description: 'Apex predator before T-Rex showed up.', promptSuffix: 'Allosaurus, photorealistic, large predator, mid-Jurassic landscape, dramatic lighting, 8k' },
  Gallimimus: { name: 'Gallimimus', emoji: '🦕', traits: ['Ultra-Fast','Agile','Athletic','Effortlessly Cool'], description: 'Fastest runner in the Jurassic.', promptSuffix: 'Gallimimus, photorealistic, sleek feathered body, full sprint pose, open prehistoric plains, motion blur, 8k' },
  Diplodocus: { name: 'Diplodocus', emoji: '🦕', traits: ['Serene','Languid','Patient','Utterly Zen'], description: 'Most zen creature to ever exist.', promptSuffix: 'Diplodocus, photorealistic, extremely long elegant neck, river delta, serene, 8k' },
  Mosasaurus: { name: 'Mosasaurus', emoji: '🐊', traits: ['Aquatic Apex','Sleek','Powerful','Oceanic Ruler'], description: 'Ruled the prehistoric seas.', promptSuffix: 'Mosasaurus, photorealistic, underwater prehistoric ocean, bioluminescent, deep-sea lighting, 8k' },
  Plesiosaurus: { name: 'Plesiosaurus', emoji: '🐊', traits: ['Graceful','Mysterious','Long-Necked','Serene'], description: 'Glided through ancient oceans with impossible elegance.', promptSuffix: 'Plesiosaurus, photorealistic, long elegant neck, clear prehistoric ocean, rays of light, 8k' },
  Spinosaurus: { name: 'Spinosaurus', emoji: '🦖', traits: ['Massive','Semi-Aquatic','Ancient Power','Apex'], description: 'Bigger than T-Rex, hunts in rivers.', promptSuffix: 'Spinosaurus, photorealistic, iconic neural spine sail, river environment, misty prehistoric atmosphere, 8k' },
  Iguanodon: { name: 'Iguanodon', emoji: '🦕', traits: ['Docile','Adaptable','Classic','Ancient Heritage'], description: 'One of the first dinosaurs ever discovered.', promptSuffix: 'Iguanodon, photorealistic, distinctive thumb spike, Cretaceous forest, 8k' },
  Troodon: { name: 'Troodon', emoji: '🦖', traits: ['Most Intelligent','Cunning','Playful','Always Scheming'], description: 'Smartest dinosaur. Always up to something.', promptSuffix: 'Troodon, photorealistic, large intelligent eyes, playful stance, moonlit forest, 8k' },
  Anchiornis: { name: 'Anchiornis', emoji: '🦅', traits: ['Delicate','Colorful','Songful','Spirited'], description: 'Tiny feathered marvel of the Jurassic.', promptSuffix: 'Anchiornis, photorealistic, tiny feathered four-winged dinosaur, vibrant plumage, lush forest, 8k' },
  Archaeopteryx: { name: 'Archaeopteryx', emoji: '🦅', traits: ['Original','Pioneering','Watchful','Timeless'], description: 'The first feathered link between dinos and birds.', promptSuffix: 'Archaeopteryx, photorealistic, feathered wings, Jurassic lagoon, soft morning light, 8k' },
};

export type Species = 'Dog'|'Cat'|'Bird'|'Rabbit'|'Hamster/Guinea Pig'|'Fish'|'Reptile'|'Small Mammal';

export const SPECIES: Species[] = ['Dog','Cat','Bird','Rabbit','Hamster/Guinea Pig','Fish','Reptile','Small Mammal'];

interface BreedEntry { breed: string; dino: DinoKey; }

export const BREEDS: Record<Species, BreedEntry[]> = {
  Dog: [
    ...['Rottweiler','German Shepherd','Doberman','Cane Corso','Belgian Malinois','Pitbull','Dogo Argentino'].map(b => ({ breed: b, dino: 'TRex' as DinoKey })),
    ...['Akita','Chow Chow','Shiba Inu','Basenji'].map(b => ({ breed: b, dino: 'Ankylosaurus' as DinoKey })),
    ...['Border Collie','Australian Shepherd','Jack Russell','Dalmatian'].map(b => ({ breed: b, dino: 'Velociraptor' as DinoKey })),
    ...['Vizsla','Weimaraner','Greyhound'].map(b => ({ breed: b, dino: 'Gallimimus' as DinoKey })),
    ...['Great Dane','Saint Bernard','Newfoundland','Bernese Mountain Dog','Mastiff'].map(b => ({ breed: b, dino: 'Brachiosaurus' as DinoKey })),
    ...['Labrador','Golden Retriever','Beagle','Poodle','Cocker Spaniel'].map(b => ({ breed: b, dino: 'Triceratops' as DinoKey })),
    ...['Chihuahua','Yorkshire Terrier','Dachshund','Pomeranian'].map(b => ({ breed: b, dino: 'Compsognathus' as DinoKey })),
    ...['Samoyed','Maltese','Bichon Frise','Shih Tzu'].map(b => ({ breed: b, dino: 'Parasaurolophus' as DinoKey })),
    ...['Siberian Husky','Alaskan Malamute'].map(b => ({ breed: b, dino: 'Pachycephalosaurus' as DinoKey })),
  ],
  Cat: [
    ...['Bengal','Savannah','Abyssinian'].map(b => ({ breed: b, dino: 'Carnotaurus' as DinoKey })),
    ...['Siamese','Oriental Shorthair'].map(b => ({ breed: b, dino: 'Dilophosaurus' as DinoKey })),
    ...['Maine Coon','Norwegian Forest Cat'].map(b => ({ breed: b, dino: 'Allosaurus' as DinoKey })),
    ...['Ragdoll','Persian','British Shorthair'].map(b => ({ breed: b, dino: 'Diplodocus' as DinoKey })),
    { breed: 'Sphynx', dino: 'Pachycephalosaurus' },
    { breed: 'Scottish Fold', dino: 'Stegosaurus' },
    ...['Russian Blue','Domestic Shorthair'].map(b => ({ breed: b, dino: 'Velociraptor' as DinoKey })),
  ],
  Bird: [
    { breed: 'Macaw', dino: 'Quetzalcoatlus' },
    ...['African Grey','Cockatoo','Amazon Parrot'].map(b => ({ breed: b, dino: 'Pteranodon' as DinoKey })),
    ...['Budgie','Lovebird'].map(b => ({ breed: b, dino: 'Microraptor' as DinoKey })),
    ...['Cockatiel','Canary','Finch'].map(b => ({ breed: b, dino: 'Anchiornis' as DinoKey })),
    { breed: 'Pigeon/Dove', dino: 'Archaeopteryx' },
  ],
  Rabbit: [
    ...['Holland Lop','Netherland Dwarf','Mini Rex','Lionhead','Flemish Giant','Mixed Breed'].map(b => ({ breed: b, dino: 'Protoceratops' as DinoKey })),
  ],
  'Hamster/Guinea Pig': [
    ...['Syrian Hamster','Dwarf Hamster','American Guinea Pig','Abyssinian Guinea Pig','Peruvian Guinea Pig'].map(b => ({ breed: b, dino: 'Compsognathus' as DinoKey })),
  ],
  Fish: [
    ...['Koi','Arowana','Discus','Oscar'].map(b => ({ breed: b, dino: 'Mosasaurus' as DinoKey })),
    ...['Goldfish','Betta','Guppy'].map(b => ({ breed: b, dino: 'Plesiosaurus' as DinoKey })),
  ],
  Reptile: [
    { breed: 'Bearded Dragon', dino: 'Stegosaurus' },
    ...['Gecko','Chameleon'].map(b => ({ breed: b, dino: 'Iguanodon' as DinoKey })),
    ...['Python','Monitor Lizard'].map(b => ({ breed: b, dino: 'Spinosaurus' as DinoKey })),
    { breed: 'Iguana', dino: 'Parasaurolophus' },
    { breed: 'Tortoise', dino: 'Ankylosaurus' },
  ],
  'Small Mammal': [
    ...['Ferret','Chinchilla'].map(b => ({ breed: b, dino: 'Troodon' as DinoKey })),
    { breed: 'Hedgehog', dino: 'Ankylosaurus' },
    { breed: 'Sugar Glider', dino: 'Microraptor' },
  ],
};

export function lookupDino(species: Species, breed: string): Dino | null {
  const entry = BREEDS[species]?.find(b => b.breed === breed);
  if (!entry) return null;
  return DINOS[entry.dino];
}

// Fuzzy lookup for AI-detected breeds (handles synonyms / partial matches)
export function lookupDinoByDetection(species: string, breed: string): { dino: Dino; matchedSpecies: Species; matchedBreed: string } | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sp = norm(species);
  const br = norm(breed);

  // Map detected species to our Species keys
  const speciesMap: Record<string, Species> = {
    dog: 'Dog', puppy: 'Dog', canine: 'Dog',
    cat: 'Cat', kitten: 'Cat', feline: 'Cat',
    bird: 'Bird', parrot: 'Bird',
    rabbit: 'Rabbit', bunny: 'Rabbit',
    hamster: 'Hamster/Guinea Pig', guineapig: 'Hamster/Guinea Pig',
    fish: 'Fish',
    reptile: 'Reptile', lizard: 'Reptile', snake: 'Reptile', tortoise: 'Reptile', turtle: 'Reptile',
    ferret: 'Small Mammal', chinchilla: 'Small Mammal', hedgehog: 'Small Mammal', sugarglider: 'Small Mammal',
  };

  let matchedSpecies: Species | null = null;
  for (const k of Object.keys(speciesMap)) {
    if (sp.includes(k)) { matchedSpecies = speciesMap[k]; break; }
  }
  if (!matchedSpecies) {
    // try matching breed string against species hints
    for (const k of Object.keys(speciesMap)) {
      if (br.includes(k)) { matchedSpecies = speciesMap[k]; break; }
    }
  }
  if (!matchedSpecies) return null;

  const list = BREEDS[matchedSpecies];
  // try direct contains either way
  let entry = list.find(b => {
    const bn = norm(b.breed);
    return bn === br || bn.includes(br) || br.includes(bn);
  });
  // try token overlap
  if (!entry) {
    const tokens = breed.toLowerCase().split(/\s+/).filter(Boolean);
    entry = list.find(b => tokens.some(t => norm(b.breed).includes(norm(t)) && t.length > 2));
  }
  if (!entry) entry = list[0]; // fallback to first breed in species

  return { dino: DINOS[entry.dino], matchedSpecies, matchedBreed: entry.breed };
}

export function buildPrompt(dino: Dino, breedName: string): string {
  const traits = dino.traits.slice(0, 4).join(', ');
  return `A premium Pixar-style 3D animated dinosaur-pet hybrid using the uploaded pet photo as the exact identity reference. Preserve the exact facial identity of the uploaded ${breedName} pet: eyes, nose, muzzle, ears, fur colour, facial markings, breed identity, expression, proportions. Transform ONLY the body into a cute cartoon ${dino.name} dinosaur hybrid. Character personality: ${dino.description} Traits: ${traits}. Style: Pixar animated movie quality, DreamWorks expressive character design, premium 3D rendering, cinematic warm lighting, adorable chunky baby dinosaur anatomy, oversized expressive eyes, collectible figurine quality, transparent background, single subject, square composition. Do not alter pet face identity. Do not create generic cartoon animals. No text. No watermark.`;
}
