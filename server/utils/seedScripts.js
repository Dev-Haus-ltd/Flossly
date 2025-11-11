/**
 * Script to seed default scripts into DictionaryScripts table
 * Run this script to populate the default/premade scripts
 * 
 * Usage: You can run this manually or create an API endpoint to call it
 */

import { DictionaryScript } from "../models";

const defaultScripts = [
  {
    key: "composite-bonding",
    title: "Composite Bonding Script",
    content: `"Good [morning/afternoon], thank you for calling [Practice Name]. My name is [Name]. How may I help you today?"
[Patient mentions composite bonding]
"That's wonderful! Composite bonding is one of our most popular treatments for creating beautiful, natural-looking smiles. May I take your name please?"
"Thank you, [Patient Name]. To help me provide you with the best information, could you tell me what you're hoping to achieve with composite bonding? Are you looking to close gaps, reshape teeth, or address discoloration?"
"I completely understand. Composite bonding is an excellent choice for that because it's minimally invasive and can often be completed in just one appointment. The results are immediate, and our dentist, Dr. [Name], specializes in creating natural-looking transformations that enhance your smile while keeping your original teeth intact."
"Our initial consultation includes a full assessment where Dr. [Name] will show you exactly what's possible and create a personalized treatment plan. The consultation fee is [amount], which is fully deductible from your treatment cost if you proceed."
"Would mornings or afternoons work better for you? We have availability this [day] at [time] or [alternative day] at [time]."
"Perfect! I've scheduled you for [day and time]. You'll receive a confirmation text shortly with all the details. Is there anything else you'd like to know before your appointment?"
"We're looking forward to meeting you, [Patient Name]. Have a great day!"`,
    sortOrder: 1,
  },
  {
    key: "invisalign",
    title: "Invisalign Script",
    content: `"Good [morning/afternoon], thank you for calling [Practice Name]. My name is [Name]. How may I help you today?"
[Patient mentions Invisalign]
"Excellent choice! Invisalign is a fantastic way to straighten your teeth discreetly. May I have your name please?"
"Thank you, [Patient Name]. Have you had braces before, or is this your first time considering teeth straightening? And what's prompting you to look into Invisalign now?"
"Many of our patients choose Invisalign for exactly that reason. The clear aligners are virtually invisible, so most people won't even notice you're wearing them. You can remove them for eating and special occasions, and there are no dietary restrictions like with traditional braces."
"Our practice uses the latest 3D scanning technology, so we can show you a digital preview of your new smile before you even start treatment."
"Treatment time varies depending on your specific needs, but most patients complete their journey in 12 to 18 months. During your consultation, Dr. [Name] will give you a precise timeline and a detailed cost breakdown. We also offer flexible payment plans starting from [amount] per month to make treatment more manageable."
"The first step is a complimentary Invisalign consultation where we'll assess your suitability, show you the digital smile simulation, and answer all your questions. There's absolutely no obligation."
"Do you prefer appointments during the week or on weekends? We have openings on [day] at [time] or [day] at [time]."
"Wonderful! I've reserved [day and time] for you. You'll receive a confirmation email with everything you need to know. Can I take the best contact number for you?"
"Thank you for choosing [Practice Name], [Patient Name]. We're excited to help you achieve the smile you deserve!"`,
    sortOrder: 2,
  },
  {
    key: "general-new-patient",
    title: "General New Patient Enquiry Script",
    content: `"Good [morning/afternoon], thank you for calling [Practice Name]. My name is [Name]. How may I help you today?"
"Thank you for calling. May I have your name please?"
"Are you currently registered with a dentist, or are you looking to join our practice?"
"What brought you to call us today? Are you experiencing any discomfort, or are you interested in a specific treatment?"
[For pain/emergency]: "I'm sorry to hear you're experiencing discomfort. We'll do our best to see you as quickly as possible."
[For cosmetic/general]: "That's great that you're being proactive about your dental health. We'd love to welcome you to our practice."
"At [Practice Name], we pride ourselves on providing comfortable, high-quality dental care. Our team is dedicated to making every visit as pleasant as possible, and we use the latest technology to ensure the best outcomes."
"I'd like to get you booked in for a comprehensive new patient examination. This includes a full assessment, X-rays if needed, and a discussion about any concerns you have. The appointment takes about 45 minutes."
"Do mornings or afternoons suit you better? We have availability on [day] at [time] or [alternative]."
"The new patient examination fee is [amount]. Do you have dental insurance? We accept most major providers and can help you maximize your benefits."
"We'll send you a new patient registration form via email before your appointment. If you could complete that beforehand, it will save time on the day."
"Perfect! You're all booked for [day and time] with Dr. [Name]. You'll receive a confirmation shortly. Is there anything else I can help you with today?"
"We look forward to welcoming you to [Practice Name], [Patient Name]!`,
    sortOrder: 3,
  },
  {
    key: "emergency-appointment",
    title: "Emergency Appointment Script",
    content: `"Good [morning/afternoon], thank you for calling [Practice Name]. My name is [Name]. How may I help you today?"
[Patient mentions emergency/pain]
"I'm really sorry to hear you're in pain. Let me help you get seen as quickly as possible. May I have your name please?"
"Thank you, [Patient Name]. Can you tell me what's happened? Are you experiencing pain, swelling, bleeding, or have you had an injury to your teeth?"
"How long have you been experiencing this? And on a scale of 1 to 10, with 10 being the worst pain, how would you rate it?"
[Listen carefully and show empathy]
"I completely understand how uncomfortable that must be. Let me check our emergency slots right away."
"Are you currently registered with our practice, or is this your first time calling us?"
[If existing patient]: "Thank you. I can see your records here."
[If new patient]: "That's no problem at all. We always make room for emergency patients."
"The good news is we can see you today at [time]. Would you be able to make it in for that appointment?"
[If yes]: "Perfect! I've got you booked in at [time] with Dr. [Name]."
[If no]: "What time would work better for you? We really want to get you out of pain as soon as possible."
"The emergency appointment fee is [amount], which includes the examination and any immediate treatment needed to relieve your pain. We'll discuss any follow-up treatment once we've assessed the situation."
"Do you have any allergies to medications or any medical conditions we should be aware of?"
"In the meantime, you can take over-the-counter pain relief like ibuprofen or paracetamol if you're not allergic. Avoid very hot or cold foods, and if there's swelling, you can apply a cold compress to the outside of your face for 15 minutes at a time."
"If your symptoms worsen before your appointment, please call us back immediately or go to A&E if it's outside our opening hours."
"You're all set for [time] today. We'll send you a confirmation text with the address and what to bring. Please try to arrive 5 minutes early so we can get you registered quickly."
"Is there anything else I can help you with right now, [Patient Name]?"
"We'll take good care of you when you arrive. See you shortly!"`,
    sortOrder: 4,
  },
];

export const seedDefaultScripts = async () => {
  try {
    for (const script of defaultScripts) {
      await DictionaryScript.findOrCreate({
        where: { key: script.key },
        defaults: script,
      });
    }
    console.log("Default scripts seeded successfully");
    return { success: true, message: "Scripts seeded successfully" };
  } catch (error) {
    console.error("Error seeding scripts:", error);
    throw error;
  }
};

