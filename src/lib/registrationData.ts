export const petTypes = [
  { emoji: "🐕", label: "Canine" },
  { emoji: "🐈", label: "Feline" },
  { emoji: "🐠", label: "Aquatic" },
  { emoji: "🦜", label: "Avian" },
  { emoji: "🐇", label: "Small Pet" },
  { emoji: "🦎", label: "Reptile" },
  { emoji: "🐝", label: "Insect" },
  { emoji: "🐎", label: "Equine" },
  { emoji: "🐾", label: "Other" },
];

export const breedsByType: Record<string, string[]> = {
  Canine: [
    "Labrador Retriever","Golden Retriever","German Shepherd","Beagle","Pomeranian","Shih Tzu",
    "Doberman","Rottweiler","Boxer","Dachshund","Siberian Husky","Great Dane","Cocker Spaniel",
    "Indie/Mixed Breed","Dalmatian","Pug","Border Collie","Maltese","Chihuahua","Bulldog",
    "Saint Bernard","Lhasa Apso","Chow Chow","Rajapalayam","Mudhol Hound","Kanni","Chippiparai",
    "Other (specify)",
  ],
  Feline: [
    "Persian","Siamese","Maine Coon","British Shorthair","Bengal","Ragdoll","Himalayan","Bombay",
    "Turkish Angora","Abyssinian","Indie/Mixed Breed","Sphynx","Scottish Fold","Russian Blue",
    "American Shorthair","Burmese","Other (specify)",
  ],
  Avian: [
    "Budgerigar (Budgie)","Cockatiel","African Grey","Lovebird","Macaw (Blue-and-Gold)",
    "Macaw (Scarlet)","Amazon Parrot","Indian Ringneck Parakeet","Alexandrine Parakeet",
    "Cockatoo","Sun Conure","Finch (Zebra)","Canary","Mynah","Java Sparrow","Other (specify)",
  ],
  Aquatic: [
    "Goldfish","Betta (Siamese Fighting Fish)","Guppy","Molly","Platy","Discus","Arowana",
    "Oscar","Koi","Cichlid","Angelfish","Flowerhorn","Neon Tetra","Swordtail","Other (specify)",
  ],
  Reptile: [
    "Leopard Gecko","Crested Gecko","Bearded Dragon","Ball Python","Corn Snake",
    "Red-eared Slider Turtle","Indian Star Tortoise","Russian Tortoise","Blue-tongued Skink",
    "Chameleon (Veiled)","Water Monitor","Other (specify)",
  ],
  "Small Pet": [
    "Holland Lop Rabbit","Rex Rabbit","Syrian Hamster","Dwarf Hamster","Guinea Pig",
    "Chinchilla","Gerbil","Ferret","Hedgehog","Degu","Sugar Glider","Other (specify)",
  ],
  Insect: [
    "Praying Mantis","Giant African Millipede","Tarantula","Stick Insect",
    "Hissing Cockroach","Beetle","Other (specify)",
  ],
  Equine: [
    "Thoroughbred","Arabian","Marwari","Kathiawari","Pony","Donkey","Mule","Other (specify)",
  ],
};

export const petTypeEmoji: Record<string, string> = {};
petTypes.forEach((pt) => { petTypeEmoji[pt.label] = pt.emoji; });

export const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

// Validation helpers
export function getPasswordStrength(pw: string): "Weak" | "Medium" | "Strong" {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return "Weak";
  if (score <= 3) return "Medium";
  return "Strong";
}

export function validateStep1(fields: { fullName: string; email: string; mobile: string; password: string }) {
  const errors: Record<string, string> = {};
  if (fields.fullName.length < 2) errors.fullName = "Name must be at least 2 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = "Enter a valid email address";
  if (!/^\d{10}$/.test(fields.mobile)) errors.mobile = "Enter a valid 10-digit mobile number";
  if (fields.password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (!/[0-9]/.test(fields.password) || !/[a-zA-Z]/.test(fields.password))
    errors.password = "Password must contain at least one letter and one number";
  return errors;
}

export function validateStep2(fields: { selectedPetType: string; petName: string; breed: string; age: string; gender: string }) {
  const errors: Record<string, string> = {};
  if (!fields.selectedPetType) errors.selectedPetType = "Please select your pet type";
  if (fields.petName.length < 2) errors.petName = "Pet name must be at least 2 characters";
  if (!fields.breed.trim()) errors.breed = "Species/breed is required";
  const ageNum = parseFloat(fields.age);
  if (!fields.age || isNaN(ageNum) || ageNum < 0 || ageNum > 50) errors.age = "Age must be between 0 and 50";
  if (!fields.gender) errors.gender = "Gender is required";
  return errors;
}
