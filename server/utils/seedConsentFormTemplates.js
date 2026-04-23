import sequelize from './db'
import { ConsentFormTemplate } from '../models'

let _seedAttempted = false

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

const wrap = (title, body) => `<div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.65;">
  <div style="text-align:center;border-bottom:2px solid #0061FB;padding-bottom:14px;margin-bottom:22px;">
    <h1 style="margin:0;font-size:20px;color:#0061FB;">${title}</h1>
    <p style="margin:6px 0 0;font-size:12px;color:#666;">Please read carefully before signing</p>
  </div>
  ${body}
</div>`

const sec = (title, content) =>
  `<div style="margin-bottom:16px;"><h3 style="font-size:13px;font-weight:700;color:#0061FB;margin:0 0 7px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;">${title}</h3>${content}</div>`

const p = (...lines) => lines.map(l => `<p style="font-size:13px;margin:0 0 8px;">${l}</p>`).join('')

const ul = (...items) =>
  `<ul style="margin:6px 0;padding-left:20px;font-size:13px;">${items.map(i => `<li style="margin:4px 0;">${i}</li>`).join('')}</ul>`

const ol = (...items) =>
  `<ol style="margin:6px 0;padding-left:20px;font-size:13px;">${items.map(i => `<li style="margin:4px 0;">${i}</li>`).join('')}</ol>`

// ---------------------------------------------------------------------------
// System consent form templates — content sourced from practice Google Drive
// ---------------------------------------------------------------------------

const SYSTEM_CONSENT_FORMS = [

  // 1 — Aligner consent
  {
    key: 'aligner_consent',
    name: 'Aligner Consent',
    category: 'Orthodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Aligner Treatment Informed Consent',
      sec("The Patient's Responsibility",
        ol(
          'Before treatment, visit an Orthodontist or dental professional for a comprehensive dental exam and to receive precise treatment information.',
          'Follow brushing & oral hygiene instructions to avoid complications with your teeth and gums. Attend all appointments on the indicated date(s) and time. This includes attending your routine exams and cleanings every 3 to 6 months.',
          'Follow food restrictions to avoid damage to your teeth and orthodontic appliances (braces, aligners, retainers).',
          'Total and complete patient compliance is mandatory.',
        )
      ) +
      sec('Aligners',
        ol(
          'A series of aligners (orthodontic appliances) gently move your teeth to a desired position stage by stage.',
          'Physical or digital (scan) impressions of your teeth, images, x-rays and 3D tooth positioning technology are used to create your 3D treatment plan and manufacture your aligners.',
          'Once received, begin wearing your aligners as soon as possible otherwise they may not fit over time due to natural tooth movement. Failure to comply may result in additional diagnostic procedures or treatment at an extra cost.',
          'Wear your aligners for 22 hours per day, 2 weeks each unless instructed differently by your dentist.',
          'You must remove your aligners to eat, otherwise they may become damaged.',
          'Aligners may not be completely clear and may present with spaces between the tips of the teeth and aligners, as well as with bubbles due to saliva.',
          'Aligners work by applying pressure to your teeth which may result in discomfort, and in some cases, mild to advanced pain and tooth mobility.',
          'You may experience a temporary increase in salivation or dryness of mouth particularly due to certain medications.',
          'Treatment types which only move the front teeth do not address bite issues in the molar region.',
          'You must contact us immediately if you experience any issues with your treatment or aligners. Failure to do so, or skipping aligners may result in treatment delays or personal injury.',
          'Aligners may be manufactured by a 3rd-party under a separate agreement. I understand my dentist will instruct the manufacturer based on my case specifications and information provided.',
          'As the aligners (as a medical device) are uniquely manufactured to the specifications of the patient, there are no refunds available unless the appliance is faulty or the correct service has not been rendered.',
          'Do not modify your aligners unless instructed to do so. This may damage your aligners and negatively affect your treatment.',
          'You may purchase replacement appliances (e.g. aligners or retainers) which have been lost or damaged due to patient neglect or non-compliance.',
        )
      ) +
      sec('Oral Hygiene',
        ul(
          'Decay, permanent markings (decalcification), and/or gum disease may occur without thorough tooth brushing and flossing. Immaculate oral hygiene is required.',
          'Sugary foods and snacking should be reduced significantly.',
        )
      ) +
      sec('Tooth Sensitivity / Damage',
        ul(
          'Sensitivity may occur.',
          'A dead (non-vital) tooth may occur. Teeth negatively affected by deep fillings or trauma may die during or without orthodontic treatment.',
          'Undetected dead (non-vital) teeth may flare up during orthodontic tooth movement. A root canal (endodontic treatment) may be needed to correct this.',
          'Teeth may come out of the gum (supra-erupt) without, at least, partial aligner coverage.',
        )
      ) +
      sec('Root Resorption',
        ul(
          'The root ends of the teeth may be shortened due to treatment, known as root resorption. Shortened roots generally have no impact in healthy oral environments.',
          'Potential gum disease in later life however may negatively impact the affected tooth\'s longevity due to root resorption.',
          'Aside from orthodontic treatment, root resorption may occur from cuts, trauma, impaction, endocrine disorders and/or spontaneously.',
        )
      ) +
      sec('Gum & Bone Tissues',
        ul(
          'Gum tissue levels surrounding your teeth are always dependent on the amount of underlying bone supporting your teeth.',
          'Often, when aligning crowded teeth, there may be a lack of supporting bone and therefore, gum tissue. As a result, gum tissue and bone support may be inadequate, requiring periodontal treatment.',
          'Missing tissue in the interproximal spaces may result in "Black triangles" as a result of aligning crowded teeth.',
          'In some cases bone and gum health can become aggravated or impaired.',
          'Sharp edges on aligners may mildly cut the gums causing sores or discomfort. Gently filing sharp edges with an emery board or nail file may correct this.',
        )
      ) +
      sec('Treatment Time',
        ul(
          'The estimated treatment duration may be delayed.',
          'Non-compliance, damaged/missing appliances and missed appointments may increase the treatment duration and negatively impact the predicted results.',
        )
      ) +
      sec('TMJ',
        ul(
          'Although rare, TMJ (Temporomandibular joint) issues may occur or worsen during orthodontic treatment.',
          'In many cases, tooth alignment and bite correction may improve relative TMJ pain.',
        )
      ) +
      sec('Limitations',
        ul(
          'Implants or tooth roots fused to the surrounding bone (Hypercementosis/Ankylosis) will not move with clear aligners.',
          'Speech may be temporarily affected.',
        )
      ) +
      sec('Relapse',
        p('Natural phenomena tend to cause your teeth to return to their original position after treatment (Relapse). Retainers are worn for 3–6 months after treatment for 22 hours/day then at night indefinitely. When retention is discontinued, relapse may occur.')
      ) +
      sec('Final Consent',
        p('I consent to the taking of photographs, study models and x-rays before, during and after orthodontic treatment to assist in the planning and progress of treatment objectives. I acknowledge I am engaging in orthodontic therapy with full understanding of the risks and responsibilities outlined above.')
      )
    ),
  },

  // 2 — Bonded retainer consent
  {
    key: 'bonded_retainer_consent',
    name: 'Bonded Retainer Consent',
    category: 'Orthodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Bonded Retainer Consent',
      p('You are having / have just had a bonded retainer placed on your teeth. There are some crucial things you need to be aware of:') +
      ol(
        'The retainer is glued on to your teeth to help maintain their positioning. However it is not completely 100% guaranteed to do this. Teeth can still move for all sorts of reasons. Sometimes the retainer glue comes off without you knowing and so teeth move. It is, therefore, important to wear a clear night retainer on top also to give you added protection from tooth movement.',
        'The retainer is a plaque and food trap. Therefore excellent levels of hygiene must be maintained to prevent decay around the retainer and/or gum disease where the retainer sits against the gums. This will result in costly dental work to fix and repair. Please clean around the retainer with an interdental TePe brush <strong>after every meal</strong> to keep it clean and your teeth and gums healthy.',
        'It is critical to attend 6 monthly check-ups with us so we can continuously check the wire and glue are intact, and that your teeth and gums are healthy. Not doing so will void your 5-year warranty for Invisalign treatment.',
        'You must avoid eating hard and chewy foods on your front teeth as this can cause the wire to come loose. If this happens you must report it to us as soon as possible so we can remedy the issue. Failing to do so voids your 1-year warranty for the bonded retainer. Please be aware that repeat breakages, and breakages beyond the 1-year warranty will incur a charge to repair or replace. Costs for this start from £100 and will be dependent on the extent of damage and the extent of remedial work required.',
      ) +
      `<div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:10px 14px;margin-top:14px;font-size:13px;font-weight:600;">
        PLEASE CONTINUE TO WEAR YOUR CLEAR NIGHT RETAINERS EVERY NIGHT ALSO TO PREVENT TOOTH MOVEMENT. HAVING A BONDED WIRE RETAINER DOES NOT EXEMPT YOU FROM THIS. TEETH WILL MOVE IF YOU DON'T WEAR YOUR NIGHT RETAINERS.
      </div>`
    ),
  },

  // 3 — Bonding info
  {
    key: 'bonding_info',
    name: 'Bonding Info',
    category: 'Cosmetic',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Composite Bonding — Patient Information',
      sec('What Is Dental Bonding?',
        p('Dental bonding is a cosmetic dentistry procedure in which a tooth-coloured composite white filling material is applied to a tooth, sculpted into shape, hardened, and polished. It\'s called bonding because the material bonds to the tooth. Dental bonding is ideal for small cosmetic dentistry work, such as fixing a broken or chipped tooth or closing small gaps between teeth. It is also used as a tooth-coloured filling for small cavities because it\'s more cosmetically appealing than silver fillings.')
      ) +
      sec('What Does Dental Bonding Involve?',
        p('We will maintain good moisture control to make sure the material does not get contaminated or wet with saliva during its placement. We will first apply a gentle solution to the surface of your teeth for around half a minute, then rinse with water. This solution etches the tooth surface to help the bonding material stay in place. The putty-like bonding material is then placed on the tooth\'s surface, shaped, and sculpted. A special blue-coloured light is used to help the material harden and set. Finally, the composite is shaped, polished and buffed for a smooth finish.')
      ) +
      sec('Advantages',
        ul(
          '<strong>Cost:</strong> More affordable than porcelain veneers or crowns.',
          '<strong>Speed:</strong> Dental bonding typically requires only one visit.',
          '<strong>Ease:</strong> Injections or anaesthesia is usually not necessary. Least amount of enamel removal compared to veneers and crowns.',
          '<strong>Minimally invasive:</strong> Requires minimal tooth preparation.',
        )
      ) +
      sec('Disadvantages',
        ul(
          '<strong>Staining:</strong> Unlike crowns and porcelain veneers, dental bonding tends to become discoloured over time. Coffee, tea, red wine, and cigarette smoke can stain the material. Avoid these substances for 24–48 hours after bonding.',
          '<strong>Less durable:</strong> Not as strong and long-lasting as porcelain veneers and crowns. Can chip easily. With proper care, dental bonding can last around 3–6 years.',
          '<strong>Eating:</strong> Lifestyle changes will be necessary. Avoid biting directly onto hard foods (crusty bread, corn on the cob, pizza). Use a knife and fork to cut food into smaller pieces.',
          '<strong>Long-term removal:</strong> A tiny amount of tooth enamel may be removed when bonding is taken off in the future.',
        )
      ) +
      sec('Frequently Asked Questions',
        `<table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f3f4f6;"><td style="padding:7px 10px;font-weight:600;">How long will it last?</td><td style="padding:7px 10px;">3–6 years with proper care</td></tr>
          <tr><td style="padding:7px 10px;font-weight:600;">Can it chip or fracture?</td><td style="padding:7px 10px;">Yes — incurs a £100 repair charge per chip unless smile warranty is taken out</td></tr>
          <tr style="background:#f3f4f6;"><td style="padding:7px 10px;font-weight:600;">Will it discolour?</td><td style="padding:7px 10px;">Yes — requires annual polishing at an additional cost of £150</td></tr>
          <tr><td style="padding:7px 10px;font-weight:600;">Is enamel removed on removal?</td><td style="padding:7px 10px;">Possibly a minimal amount</td></tr>
        </table>`
      )
    ),
  },

  // 4 — Bonding info Ts & Cs
  {
    key: 'bonding_info_ts_cs',
    name: 'Bonding Info Ts & Cs',
    category: 'Cosmetic',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Composite Bonding — Terms & Conditions',
      p('Composite Bonding treatment is a great treatment to mask discolouration and/or change the shape/sizes/proportions of teeth. However it does come with risks including the risk of chipping/breakages of the composite and also staining. Composite material requires intense maintenance by you, including but not limited to excellent oral hygiene including flossing and regular 6 monthly checks and polishes of the composites.') +
      p('These terms and conditions outline the necessary requirements we need from you so the treatment can be completed to its full potential.') +
      sec('I Understand:',
        sec('Good Mouth Hygiene',
          p('It is important that your mouth and gums are cared for to a high standard. We recommend a dental hygienist appointment before and after composite bonding to ensure you maintain good oral care yourself. Inadequate oral hygiene could result in cavities, discoloured teeth and/or gum disease.')
        ) +
        sec('Food Types / Habits',
          p('Be very careful what types of food you eat. Hard foods such as crusty bread, popcorn, ice, boiled sweets, toffee etc can break/damage the composite veneers. Habits such as nail biting, pen chewing and night grinding of your teeth will increase the risk of the composite breaking or chipping.')
        ) +
        sec('Nerve Damage',
          p('A tooth that has been traumatised by an accident or deep decay may have experienced damage to the nerve of the tooth. This may not be obvious at the start of the treatment. Further treatment may then need to be carried out on this tooth. Root canal treatment may be required (at extra cost).')
        ) +
        sec('Life-Span',
          p('Composite dental restorative material will last very well in a healthy and well-cared for mouth. Nothing in dentistry lasts forever but we expect an average of 5 years from composite bonded restorations. Within that time there may be additional repair and maintenance costs involved.')
        ) +
        sec('Night-Guard',
          p('We advise wearing the thin mouth-guard to protect your new restorations — this is an additional cost of £150. Failure to wear the night-guard as instructed will void any warranty and may lead to costs incurred.')
        )
      ) +
      `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-top:16px;font-size:13px;">
        <p style="margin:0 0 8px;font-weight:700;">Additional Agreements:</p>
        <p style="margin:0 0 6px;">☐ I agree to yearly polishing at an additional cost of £150 per polish</p>
        <p style="margin:0 0 6px;">☐ I agree to 3–6 monthly hygienist appointments for the health of my gums and teeth at an additional cost of £69</p>
        <p style="margin:0 0 6px;">☐ I understand my teeth will feel thicker and more bulky, and the shape of my lip will be affected by this</p>
        <p style="margin:0 0 6px;">☐ I understand that the colour match to my existing teeth will not be identical but as close a match as possible</p>
        <p style="margin:0;">☐ I understand there is an option to visualise my bonding result with a trial smile at an additional cost of £200</p>
      </div>` +
      `<div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:10px 14px;margin-top:14px;font-size:12px;font-weight:600;">
        CAN IT CHIP OR FRACTURE? YES — incurs a £100 charge for the repair of the chip unless smile warranty is taken out.<br/>
        WILL IT DISCOLOUR OVER TIME? YES — the bonding will need polishing up at least once a year. This is an extra cost of £150.
      </div>`
    ),
  },

  // 5 — Composite Bonding Consent
  {
    key: 'composite_bonding_consent',
    name: 'Composite Bonding Consent',
    category: 'Cosmetic',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Composite Bonding Consent',
      sec('What is Composite Bonding?',
        p('Composite Bonding is a white filling material which is bonded (glued) to your teeth in a sophisticated technique to improve the appearance of your teeth by closing gaps, fixing worn/chipped teeth and improving teeth colour and shape. Composite is bonded to the teeth, usually without any significant drilling or damage to your tooth — the colour is matched to your teeth to give a seamless join mimicking the real tooth.')
      ) +
      sec('Limitations',
        p('These include but are not limited to:') +
        ul(
          'Oral hygiene is not acceptable to receive any form of cosmetic dental restoration.',
          'The general deterioration and health of the teeth has progressed beyond the capabilities of cosmetic treatment only.',
          'The colour/staining of the teeth will not be sufficiently masked by composite material.',
          'The teeth are too crowded — we would recommend Invisalign first.',
          'There is no room for any incisal-edge lengthening in the current biting position — a more complex full-mouth rehabilitation may be required.',
        )
      ) +
      sec('Obligations I Agree to Uphold',
        sec('Good Mouth Hygiene',
          p('Maintain high standards of oral care. Inadequate oral hygiene could result in cavities, discoloured teeth and/or gum disease.')
        ) +
        sec('Food Types / Habits',
          p('Avoid hard foods such as crusty bread, popcorn, ice, boiled sweets, toffee. Avoid nail biting, pen chewing and night grinding.')
        ) +
        sec('Life-Span',
          p('We expect an average of 5 years from composite bonded restorations. Within that time there may be additional repair and maintenance costs.')
        )
      ) +
      `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-top:16px;font-size:13px;">
        <p style="margin:0 0 8px;font-weight:700;">Cost Acknowledgement:</p>
        <p style="margin:0 0 6px;">☐ I agree to 3–6 monthly polishing at an additional cost of £150 per polish</p>
        <p style="margin:0 0 6px;">☐ I agree to 3–6 monthly hygienist appointments at an additional cost of £99</p>
        <p style="margin:0 0 6px;">☐ I understand my teeth will feel thicker and more bulky</p>
        <p style="margin:0;">☐ ONCE COMPOSITES ARE PLACED WE ARE UNABLE TO REFUND THE COST. If you would like your bonding removed, this can be done at an additional charge of £100 per tooth.</p>
      </div>`
    ),
  },

  // 6 — Composite Filling Consent
  {
    key: 'composite_filling_consent',
    name: 'Composite Filling Consent',
    category: 'Restorative',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Composite Filling Consent',
      p('I understand that the treatment of my dentition involving the placement of composite resin fillings may entail certain risks. There is the possibility of failure to achieve the desired or expected results. I agree to assume those risks that may occur, even if care and diligence is exercised by my treating dentist. These risks include possible unsuccessful results and/or failure of the filling associated with, but not limited to, the following:') +
      ul(
        '<strong>Sensitivity of teeth:</strong> Often after preparation of teeth for the placement of any restoration, the prepared teeth may exhibit sensitivity. The sensitivity can be mild or severe and last for a short period or much longer. If such sensitivity is persistent, I will notify the dentist as this can be a sign of more serious problems.',
        '<strong>Risk of fracture:</strong> Inherent in the placement or replacement of any restoration is the possibility of the creation of small fracture lines in the tooth structure. Sometimes these fractures are not apparent at the time of treatment but can appear at a later time.',
        '<strong>Necessity for root canal therapy:</strong> When fillings are placed or replaced, the preparation of the teeth may lead to exposure or trauma to underlying pulp tissue. Should the pulp not heal, root canal treatment or extraction may be required.',
        '<strong>Injury to the nerves:</strong> There is a possibility of injury to the nerves of the lips, jaws, teeth, tongue or other oral or facial tissues from any dental treatment. The resulting numbness that can occur is usually temporary, but in rare instances it could be permanent.',
        '<strong>Aesthetics or appearance:</strong> Effort will be made to closely approximate the appearance of natural tooth colour. However, because many factors affect the shades of teeth, it may not be possible to exactly match the tooth coloration. The shade of composite fillings can also change over time due to mouth fluids, foods, smoking, etc.',
        '<strong>Breakage, dislodgement or bond failure:</strong> Because of extreme masticatory (chewing) pressures or other traumatic forces, it is possible for composite resin fillings to be dislodged or fractured.',
      ) +
      p('The resin-enamel bond can fail. I understand that it is my responsibility to notify this office should any undue or unexpected problems occur.') +
      p('I have been given the opportunity to ask any questions regarding the nature and purpose of composite fillings and have received answers to my satisfaction.') +
      p('We highly recommend you join our practice plan, so we can regularly monitor you and to keep your warranty valid.')
    ),
  },

  // 7 — Cooling off period for finance
  {
    key: 'cooling_off_finance',
    name: 'Cooling Off Period for Finance',
    category: 'Finance',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Cooling Off Period for Finance',
      sec('Cooling Off Period',
        p('There is a statutory <strong>\'cooling off\' period of 14 days</strong> after signature during which you can cancel the finance credit agreement with no cost to you. We are unable to start your treatment until this cooling off period has ended.')
      ) +
      sec('Waiving the Cooling Off Period',
        p('You can opt to waive the cooling off period should you wish to get started with your treatment sooner. However, if you decide to waive the cooling off period on your finance application form you are unable to obtain a refund on your treatment without incurring costs. These charges are costs we will deduct to cover any work which has already been carried out as well as any lab fees if lab work has been ordered (including the cost of ordering aligners).')
      ) +
      sec('Finance Arrangement',
        p('The finance is arranged through Tabeo, and we are authorised and regulated by the Financial Conduct Authority to carry out the regulated activity of credit broking. Reference Number: 941574.')
      ) +
      p('Please sign this form to confirm you understand and accept the terms and conditions. We are then able to commence with your treatment.')
    ),
  },

  // 8 — Crown consent
  {
    key: 'crown_consent',
    name: 'Crown Consent',
    category: 'Restorative',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Crown Consent',
      p('I understand that treatment of dental conditions requiring crowns includes certain risks and possible unsuccessful results. Even though care and diligence is exercised in the treatment of conditions requiring crowns there is no 100% guarantee of anticipated results or the longevity of the treatment.') +
      p('Nevertheless, I agree to assume the risks, possible unsuccessful results and/or failure associated with, but not limited to the following:') +
      ul(
        '<strong>Reduction or roughening of tooth structure:</strong> In making preparation of teeth for the reception of crowns it is necessary to reduce or roughen the surface of the tooth. Tooth preparation is irreversible in nature. If the crown breaks or comes off, the uncovered tooth may become more susceptible to decay.',
        '<strong>Sensitivity of teeth:</strong> Sometimes, after preparation of teeth for the reception of a crown, the teeth may exhibit sensitivity which can range from mild to severe. If sensitivity is persistent, you should notify us so that the cause may be diagnosed.',
        '<strong>Crowned teeth may require root canal treatment subsequently:</strong> Teeth after being crowned may develop a condition known as pulpitis or pulpal degeneration. Usually, this cannot be predetermined.',
        '<strong>Aesthetics or appearance:</strong> Patients will be given the opportunity to observe the appearance of the crown(s) in their mouths prior to final cementation. Although we try to match the shade as closely as possible to your existing teeth, it is difficult to get a 100% match.',
        '<strong>Chipping, breaking or loosening:</strong> This could occur due to chewing of hard materials; changes in biting forces; traumatic blows to the mouth; accidental damage; breakdown of the bonding agents; and other conditions over which the dentist has no control.',
        '<strong>Longevity of crowns:</strong> Many variables determine how long crowns can be expected to last, depending on each patient\'s individual habits or circumstances. Because of this, 100% guarantees cannot be given concerning how long a crown will last.',
        '<strong>Attendance at all appointments:</strong> Failure to attend the cementation appointment may result in failure of the crown to fit properly and an additional fee may be incurred.',
      ) +
      p('We highly recommend you join our Dentozen dental plan, so we can regularly monitor you and to keep your warranty valid.')
    ),
  },

  // 9 — Crown, Veneer and Bridge consent
  {
    key: 'crown_veneer_bridge_consent',
    name: 'Crown, Veneer and Bridge Consent',
    category: 'Restorative',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Crown, Veneer and Bridge — Consent for Final Cementation',
      p('The nature and type of material used in my crowns, bridges and/or veneers has been explained to me.') +
      p('By signing below I acknowledge and authorise the material discussed to be used in my mouth. I have been given the opportunity to view my crowns, bridges and/or veneers as processed, either on models or placed in my mouth prior to final cementation.') +
      `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:16px 0;font-size:13px;">
        <p style="margin:0 0 8px;font-weight:700;">I Confirm:</p>
        <p style="margin:0 0 6px;">☐ I approve the colour, shape, size, feel and overall appearance of the porcelain</p>
        <p style="margin:0 0 6px;">☐ I understand that once the porcelain is cemented in my mouth, the factors of colour, shape, feel and overall appearance cannot be changed without additional time and fees</p>
        <p style="margin:0 0 6px;">☐ I understand that removing cemented porcelain may create the risk of injury or breakage to the underlying teeth and will destroy the porcelain, requiring a remake</p>
        <p style="margin:0;">☐ I understand that if I authorise cementation and later decide I do not like the restorations, any replacement(s) will be at full cost</p>
      </div>` +
      p('By signing this form I give my consent for final cementation, acknowledge my approval of the appearance and authorise use of the discussed material.')
    ),
  },

  // 10 — Denture Reline Consent
  {
    key: 'denture_reline_consent',
    name: 'Denture Reline Consent',
    category: 'Prosthodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Denture Reline Consent',
      p('A denture reline involves adding new base material to the tissue side of a denture so it fits properly. This procedure is necessary when the shape of your gums and bones changes, which can cause the denture to become loose and uncomfortable.') +
      sec('Types of Reline Procedures',
        sec('Chairside Reline',
          ul(
            '<strong>Description:</strong> Performed in the dental office while you wait.',
            '<strong>Advantages:</strong> Immediate results, typically takes one visit, convenient.',
            '<strong>Disadvantages:</strong> May not be as durable or long-lasting as a laboratory reline.',
          )
        ) +
        sec('Laboratory Reline',
          ul(
            '<strong>Description:</strong> Denture is sent to a dental laboratory for relining.',
            '<strong>Advantages:</strong> Generally more durable and precise, can result in a better fit.',
            '<strong>Disadvantages:</strong> Requires you to be without your denture for a few days; multiple visits may be necessary.',
          )
        ) +
        p('You have opted for a chairside / laboratory reline.')
      ) +
      sec('Risks and Benefits',
        sec('Benefits',
          ul('Improved fit and comfort of the denture.', 'Enhanced chewing efficiency and speech.', 'Better overall oral health.')
        ) +
        sec('Risks',
          ul(
            'Possible initial discomfort as you adjust to the reline.',
            'Risk of sore spots or pressure points.',
            'Potential need for further adjustments or modifications.',
            'Risk of denture breakage during the relining process.',
          )
        )
      ) +
      sec('Post-Procedure Care',
        ol(
          'Wear the relined denture as directed by your dentist.',
          'Expect some initial discomfort; this should subside as your mouth adjusts.',
          'Maintain proper oral hygiene.',
          'Schedule a follow-up appointment if you experience persistent discomfort or other issues.',
        )
      ) +
      p('I understand the purpose and nature of the denture reline procedure, including its benefits and potential risks. I have had the opportunity to ask questions and have received satisfactory answers. I understand that no guarantees or assurances have been made to me concerning the results of the procedure.')
    ),
  },

  // 11 — Direct Access Hygienist
  {
    key: 'direct_access_hygienist_consent',
    name: 'Direct Access – Consent for Treatment with Hygienist',
    category: 'Hygiene',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Direct Access – Consent for Treatment with Hygienist',
      sec('Background',
        p('Since the 1 May 2013, The General Dental Council has enabled patients to directly access the services of dental hygienists (Direct Access). Previously, a dentist had to see a patient prior to prescribing hygiene treatment.')
      ) +
      sec('Direct Access',
        p('The hygienist can see you to provide oral hygiene advice, remove stain, tartar, bacterial deposits and other debris. The hygienist can also give you advice on the progression of gum disease, but more advanced conditions need to be assessed by a dentist and then the hygienist can continue your treatment under the prescription of the dentist.') +
        p('Dental hygienists cannot diagnose disease or give the prognosis of decaying or broken teeth. They are unable to prescribe antibiotics, painkillers or any other drugs to alleviate symptoms. Dentists remain the only member of the dental team who can carry out the full range of dental treatments and prescribe local anaesthesia and a full range of prescription only medicines.') +
        p('<strong>A visit to the hygienist only is not a substitute for a full dental examination.</strong>')
      ) +
      sec('Referral to Dentist',
        p('If your hygienist advises you to see a dentist, it is because they feel that it is in the best interests of your health. The treatment may be outside their scope of practice, or they may be uncertain about treating you without further advice. These circumstances may relate to your medical history, general health, or the condition of your mouth.')
      ) +
      sec('Consent',
        p('I have read and understand the limitations of Direct Access to a dental hygienist and agree to be treated under the Direct Access arrangements. I understand that the hygienist is not responsible for the overall health of my mouth and that regular visits to a dentist are still required.')
      )
    ),
  },

  // 12 — End of Aligner Treatment and Retainer Consent
  {
    key: 'end_of_aligner_retainer_consent',
    name: 'End of Aligner Treatment and Retainer Consent',
    category: 'Orthodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('End of Aligner Treatment and Retainer Consent',
      p('I confirm I am very happy with my orthodontic treatment and the results achieved from it; the teeth are in the positions I want them to be. I consent to have my vivera retainers made up and the bonded wire retainers placed behind my front teeth.') +
      p('I am aware that if I change my mind once this is done and choose to have further aligner treatment, I will then incur extra charges as follows:') +
      ol(
        'Chair time (charged at a rate of £300/hour)',
        'Bonded retainers (£200/arch)',
        'Vivera retainers (£200/arch)',
      ) +
      sec('Vivera Retainers',
        p('We provide one set of Vivera Retainers. That should be worn for the first 6 months full time as you did your aligner, then every night for life. Further Vivera retainers can be ordered at any time at an additional cost (£200 for a replacement set).')
      ) +
      sec('Fixed Retainers',
        p('A bonded retainer — a small wire placed at the back of the front 6 teeth — will secure the front 4/6 teeth to stop movement. You will not be able to floss normally in between your teeth so we recommend TePe brushes to clean the area.') +
        p('Maintenance is required: you must check that the bonding on the back of your teeth is in place. If for any reason this comes loose please wear your Vivera retainer as well until you can get this bonded back on.')
      ) +
      `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-top:16px;font-size:13px;">
        <p style="margin:0 0 8px;font-weight:700;">Please confirm you understand and agree:</p>
        <p style="margin:0 0 6px;">☐ I am happy with the results of my treatment</p>
        <p style="margin:0 0 6px;">☐ I understand how to use my retainers and that teeth will move if retainers are not worn as instructed</p>
        <p style="margin:0 0 6px;">☐ I understand that now my retainers have been fitted, this concludes my treatment and any further treatment or retainers would be chargeable</p>
        <p style="margin:0;">☐ Should I wish to further change the position of my teeth, a whole new course of treatment would be required, chargeable at the full rate</p>
      </div>`
    ),
  },

  // 13 — Full and Partial Denture Consent
  {
    key: 'full_partial_denture_consent',
    name: 'Full and Partial Denture Consent',
    category: 'Prosthodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Consent Form for Full and Partial Dentures',
      ul(
        'It is essential to wear the dentures made as much as possible to allow for the mouth to adapt. Dentures are a difficult change to get used to and it may take several months for the dentures to feel comfortable.',
        'Dentures are not as good as healthy, natural teeth for chewing food.',
        'Denture teeth are a different size and shape than normal teeth in order to increase chewing efficiency.',
        'Dentures depend on suction and muscle activity for their stability.',
        'Wearing dentures may become more difficult as you age so that new problems may appear with new dentures that you never had with any of the old dentures.',
        'As you age, bone loss from denture supporting areas of the mouth will make more conventional dentures more difficult to chew with and keep in your mouth.',
        'Changes in the muscle tone, gum thickness, coordination, as well as medications could adversely affect your ability to wear your dentures.',
        'A new denture will be shaped and look different than your old denture since there is constant change in the shape of your mouth.',
        'You may find it difficult to chew certain foods with dentures.',
        'A denture that was comfortable may not fit after illness or certain medical treatments in which you have lost weight.',
        'Many variables may affect partial dentures — natural teeth to which partial dentures are adjacent may become tender, sore and/or mobile; natural teeth may decay around the clasps or attachments; gum supporting the natural teeth may fail.',
        'Due to the types of materials which are necessary in the construction of these appliances, breakage may occur even though the materials used were not defective.',
        'Full dentures normally become looser when there are changes in the supporting gum tissues. When dentures become loose, relining the dentures may be necessary.',
        'Dentures may need to be adjusted after they have been fitted — this is normal.',
        'We have outlined the denture process to you and noted the need for several appointments, usually 4–5 over a time period of around 2 months.',
      ) +
      p('<strong>Consent:</strong> I have read the information above and had a chance to review and discuss my planned treatment. I understand that there is no warranty or guarantee as to any result and/or cures. I accept the above risks for the specified treatment.')
    ),
  },

  // 14 — Immediate Denture Consent
  {
    key: 'immediate_denture_consent',
    name: 'Immediate Denture Consent — What to Expect',
    category: 'Prosthodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Immediate Denture Consent Form — What to Expect',
      p('Going from natural teeth to a denture is a big adjustment for any patient. The patient\'s ability to chew food decreases about 90%. Taste of food and often speech may be altered at first. In general, an upper denture is easier to adjust to than a lower denture. The amount of stability of a denture depends on several things and not all people adapt to complete dentures as well as others. We will do everything in our power to help you adjust to your new dentures, however, dentures are a satisfactory replacement for having no teeth at all but they very rarely function as well as natural teeth.') +
      sec('Appointments',
        p('Your treatment will be an immediate denture: this means that your denture will be placed immediately after having your teeth extracted. The advantage of doing this is that you will not be without teeth following the extractions, however there is a chance the immediate dentures may not fit and further appointments may be needed to resolve this. For 3–5 weeks after the delivery of your dentures, you may require follow up appointments to adjust the denture as your mouth heals.') +
        p('It is normal for the denture to loosen as your mouth heals. The ridges that held your teeth in before will shrink and change shape. Most of your changes will occur in the first two months and then the ridge will begin to stabilise. At the end of one month, if the denture is too loose to function properly, a temporary healing reline will be needed. Complete healing and reshaping of the ridge can take anywhere from 6 months to 1 year. At this point, a permanent reline will be needed to refit the dentures.')
      ) +
      `<div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:10px 14px;margin:14px 0;font-size:13px;font-weight:600;">
        MOST PATIENTS WILL REQUIRE A NEW DEFINITIVE DENTURE (THAT WILL INCUR A FURTHER COST) TO BE MADE 3–6 MONTHS AFTER HAVING THE IMMEDIATE FITTED, AS ONCE THE TISSUES HAVE HEALED, THE GUM FORM WILL BE VASTLY DIFFERENT.
      </div>` +
      sec('Cost',
        p('The cost of an immediate denture not only includes the denture but also adjustments and any temporary healing relines needed for the first three months after delivery. After this, there may be an adjustment charge depending on individual circumstances. At the end of 9 to 12 months (when the ridge has stabilised), most patients need to have a permanent reline for which there will be a separate fee. Any new dentures will be subject to new charges accordingly.')
      ) +
      p('<strong>Consent:</strong> I have read the information above and have had a chance to review and discuss my planned treatment. I understand that there is no warranty or guarantee as to any result and/or cures.')
    ),
  },

  // 15 — Informed Consent for Onlay
  {
    key: 'onlay_consent',
    name: 'Informed Consent for Onlay',
    category: 'Restorative',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Informed Consent for Onlay',
      p('I understand that the treatment of dental conditions requiring onlays/crowns carries inherent risks and that results cannot be guaranteed. While my dentist will exercise care and diligence, I acknowledge that there is no assurance of the anticipated outcome or the longevity of the treatment.') +
      p('By proceeding with this treatment, I accept the potential risks, including but not limited to the following:') +
      ol(
        '<strong>Tooth Reduction and Irreversibility:</strong> Preparation for onlays requires the reduction or roughening of the tooth structure. While this process will be done as conservatively as possible, it is irreversible. If an onlay breaks or detaches, the exposed tooth may become more vulnerable to decay.',
        '<strong>Tooth Sensitivity:</strong> After preparation, teeth may exhibit mild to severe sensitivity, which may last for a short period or an extended duration. Persistent sensitivity should be reported to the dentist for evaluation.',
        '<strong>Potential Need for Root Canal Treatment:</strong> Crowning or onlaying a tooth may lead to a condition known as pulpitis or pulpal degeneration, which sometimes necessitates a root canal. Factors such as prior trauma, deep decay, extensive preparation, or other underlying conditions may contribute to this requirement.',
        '<strong>Aesthetics and Shade Matching:</strong> I will have the opportunity to review the appearance of my onlay(s) before final cementation. While every effort will be made to match the shade to my natural teeth, a perfect match is not always possible.',
        '<strong>Chipping, Breaking, or Loosening of the Onlay:</strong> Despite careful construction, onlays may chip, break, or become loose due to chewing hard substances, changes in biting forces, accidental trauma, or inappropriate use of teeth.',
        '<strong>Longevity of Onlay:</strong> The lifespan depends on individual factors including oral hygiene, diet, general health, and regular dental check-ups. No guarantees can be made regarding how long an onlay will last.',
        '<strong>Commitment to Follow-Up Appointments:</strong> Attending all scheduled appointments is crucial. Missing the cementation appointment may result in an improper fit and could incur additional costs.',
      ) +
      p('We highly recommend joining the Dentozen Dental Plan which allows for regular monitoring of my restorations and helps maintain my treatment warranty. We also recommend taking out a smile safe warranty for 5 years.')
    ),
  },

  // 16 — Instructions for Whitening
  {
    key: 'whitening_instructions',
    name: 'Instructions for Whitening',
    category: 'Cosmetic',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('LUMIWHITE Teeth Whitening — Informed Consent Form',
      sec('Is LUMIWHITE Teeth Whitening Safe?',
        p('Cosmetic products, such as LUMIWHITE Teeth Whitening, are subject to EU-wide safety regulations implemented in the UK by the Cosmetic Products Enforcement Regulations 2013. LUMIWHITE Teeth Whitening is safe to use under the supervision of a dentist as long as you are not allergic to any of the ingredients and there are no other contraindications. All products are registered into the Cosmetics Products Notification Portal (CPNP).')
      ) +
      sec('Who Is It Suitable For?',
        p('Suitable for:') +
        ul('Dietary stains', 'Yellow teeth due to ageing', 'Tetracycline-stained teeth', 'Yellow/Brown teeth due to fluorosis', 'Anterior teeth prior to composite bonding or porcelain veneers/crowns') +
        p('Not recommended for:') +
        ul(
          'Pregnant or breastfeeding women',
          'Patients who are not dentally fit (have caries, extensive restorations, periodontal problems)',
          'Patients who want to whiten their crowns, veneers, fillings or dentures',
          'Patients who are not willing to carry out the treatment as directed by their provider',
        )
      ) +
      sec('Risks',
        sec('Tooth Sensitivity',
          p('LUMIWHITE gels contain Potassium Nitrate and Sodium Fluoride to manage tooth sensitivity. Despite this, some patients may still experience mild sensitivity. If you are really struggling, please contact your provider. Once you have completed your whitening treatment you should no longer experience any tooth sensitivity.')
        ) +
        sec('Gum Inflammation',
          p('If the whitening gel is in prolonged contact with the gums, it may cause inflammation and some discomfort. This is usually temporary and should settle within a few days.')
        ) +
        sec('Root Resorption',
          p('This is a rare dental condition. There is some evidence which suggests the incidence of root resorption is greater in patients who have undergone root canal treatment followed by internal whitening.')
        ) +
        sec('Relapse',
          p('LUMIWHITE has been designed so the results can be long-lasting. We recommend discussing an appropriate whitening top-up programme with your dentist to help you keep your teeth the way you like them.')
        )
      ) +
      sec('How Many Applications Per Syringe?',
        p('A single 3ml LUMIWHITE syringe contains enough teeth whitening gel to undergo 5–7 applications. The number of applications may differ if your dentist has tailored their instructions to you.')
      ) +
      `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-top:16px;font-size:13px;">
        <p style="margin:0 0 8px;font-weight:700;">Declaration of Informed Consent:</p>
        <p style="margin:0 0 8px;">The total cost of LUMIWHITE Teeth Whitening will be: £_______________</p>
        <p style="margin:0 0 6px;">The procedure for whitening my teeth using LUMIWHITE Teeth Whitening has been fully explained to me and I have had the opportunity to ask questions.</p>
        <p style="margin:0;">☐ YES — I consent to having my teeth whitened using LUMIWHITE Teeth Whitening</p>
      </div>`
    ),
  },

  // 17 — Patient Agreement and Informed Consent for Tooth Extraction
  {
    key: 'tooth_extraction_consent',
    name: 'Patient Agreement and Informed Consent for Tooth Extraction',
    category: 'Oral Surgery',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Patient Agreement and Informed Consent for Tooth Extraction',
      p('Please read this form carefully and discuss with your dentist any points which require further clarification.') +
      p('Following discussion with the dentist we have agreed to extract the tooth/teeth listed on my treatment plan. The reasons for this have been explained.') +
      p('There will be some pain and swelling following a tooth extraction. This may require pain killers. There will also be bleeding of the socket. This is usually minor and easily controlled by applying pressure.') +
      sec('Risks',
        p('There are some risks / complications, which include, but are not limited to, the following:') +
        ol(
          '<strong>Infection of the extraction socket (dry socket).</strong> This may cause some pain and discomfort, but is usually easily managed by the oral surgeon/dentist.',
          '<strong>Biting of the numb lip</strong> which may cause damage after the teeth have been removed. Children should be watched closely by a parent/guardian until the numbness wears off.',
          '<strong>Damage to the Inferior Dental Nerve</strong> on each side of the Mandible (lower jaw). This nerve passes very close to the root of the lower wisdom tooth and gives feeling to the lower teeth, lower lip and chin on that side. This may cause numbness of the lower teeth, lower lip and chin. This may be temporary (6–12 months) or permanent.',
          '<strong>Damage to the Lingual Nerve</strong> on each side of the Mandible (lower jaw). This nerve passes very close to the tongue side of the lower wisdom tooth and gives feeling and taste to that side of the tongue. This may cause numbness and loss of taste to that side of the tongue. This may be temporary (6–12 months) or permanent.',
          '<strong>The tooth root tip may break off</strong> in small pieces when the tooth is taken out. The oral surgeon/dentist may not remove those pieces if there is a chance that the nerves or other structures may be damaged during removal.',
          '<strong>Damage to teeth growing tightly against the wisdom teeth</strong> during removal of the wisdom teeth.',
          '<strong>Weakness of the jaw</strong> due to removal of the wisdom teeth. The jaw may break during the procedure or during the healing period.',
          '<strong>If the upper teeth are close to the sinuses</strong>, removal may cause a hole between the mouth and the sinus. This may need further surgery.',
        )
      ) +
      p('I understand the risks of the procedure, including the risks that are specific to me, and the likely outcomes. The dentist has explained other relevant treatment options and their associated risks. The dentist has explained my prognosis and the risks of not having the procedure.') +
      p('On the basis of the above statements and conversations with the dentist, I understand the procedure, have no further questions and am happy to proceed.')
    ),
  },

  // 18 — Perio consent
  {
    key: 'perio_consent',
    name: 'Perio Consent',
    category: 'Periodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Periodontal Treatment Consent Form',
      p('Periodontal therapy involves cleaning the teeth and root surfaces from calculus, plaque, toxins and diseased tissues. This is called "deep scaling" and "root surface debridement" and is best done under local anaesthetic to avoid discomfort and allow thorough cleaning to be done.') +
      p('The aim of the treatment is to systematically clean all affected root surfaces from the harmful material and toxins that can cause further destruction of bone and supporting dental tissues.') +
      sec('As a Result of Periodontal Treatment and Therapy, You May Notice:',
        ul(
          'Increased sensitivity of the exposed root surfaces to hot, cold or sweet food and drinks',
          'Increased susceptibility to root surface decay',
          'Temporary increases in tooth mobility',
          'Recession of the gums and exposure of the root surfaces',
          'Elongation of the teeth',
          'A black triangle appearance and shadowing between the teeth where the dental papilla has been lost. This is irreversible, but if treatment is successful it can be masked.',
        )
      ) +
      p('These side effects arise as the gums begin to heal and the deep pockets below the gum resolve. The deep pockets are where all the bacteria and toxins reside and which are inaccessible to daily home cleaning.') +
      p('The success of periodontal treatment is multifactorial, but your role is central and crucial in maintaining low plaque levels in the mouth, as well as managing the other risk factors. It is for this reason that periodontal therapy does not guarantee stabilising the condition. In most cases, when the main risk factors, such as smoking and uncontrolled diabetes are eliminated, and immaculate oral hygiene is maintained, periodontal disease will stabilise. However, despite this, periodontal disease can sometimes be challenging to treat and in certain circumstances you may need a referral to a specialist in gum disease (Periodontist).') +
      p('We recommend you join our practice plan, to maintain the health of your gums and teeth.')
    ),
  },

  // 19 — Photograph Consent Form
  {
    key: 'photograph_consent',
    name: 'Photograph Consent Form',
    category: 'General',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Photograph Consent Form',
      p('I have received an explanation of the reasons why this practice wishes to take photographs of my face, mouth and teeth. The photographs might be used for:') +
      `<div style="font-size:13px;margin:14px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f3f4f6;">
            <th style="text-align:left;padding:8px 10px;font-size:12px;border:1px solid #e5e7eb;">Purpose</th>
            <th style="text-align:center;padding:8px 10px;font-size:12px;border:1px solid #e5e7eb;width:100px;">I Consent</th>
            <th style="text-align:center;padding:8px 10px;font-size:12px;border:1px solid #e5e7eb;width:120px;">I Do Not Consent</th>
          </tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">Clinical purposes relating to my treatment and kept with my confidential dental records</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 10px;border:1px solid #e5e7eb;">For teaching purposes with dental students</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">For demonstrating clinical techniques at scientific lectures</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 10px;border:1px solid #e5e7eb;">In papers published in scientific journals</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td></tr>
          <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;">For marketing use, including use on the practice website and social media pages</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td><td style="text-align:center;border:1px solid #e5e7eb;">☐</td></tr>
        </table>
      </div>` +
      p('I agree to the photographs being taken and consent to their use for the purposes I have ticked above, and in accordance with current data protection legislation.')
    ),
  },

  // 20 — Reason for treatment
  {
    key: 'reason_for_treatment',
    name: 'Reason for Treatment',
    category: 'General',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Reason for Treatment',
      p('The purpose of root canal treatment (RT) is to try and save a tooth from being extracted/pulled out/removed. There are alternative options you can consider such as doing nothing (which may lead to continued pain, swelling or abscess), or having the tooth removed instead, leaving a gap. As with all dental procedures there are some pros and cons to root canal treatment as well as some risks.') +
      p('<strong>Factors which might determine how easy or difficult a root canal might be:</strong>') +
      ul(
        'The number of roots of the tooth',
        'The amount of tooth left',
        'The extent of infection prior to treatment',
        'Experience of the operator (the dentist doing the treatment)',
        'How curved or straight the root where the canal system is',
      ) +
      sec("Pro's",
        ul(
          'Get to keep your natural tooth. Maintains space. Maintains aesthetics.',
          'If you suffer with a bleeding disorder or are on a medicine which can make you bleed, can avoid the need for an extraction.',
        )
      ) +
      sec("Con's",
        ul(
          'Lengthy procedure. Can take up to 2 hours especially on molar/back teeth (divided over two appointments). Can mean time off work to attend appointments.',
          'Financial implication. Usually if we do RT on a back tooth you will also need a crown over this.',
          'No guarantee — unfortunately RT can fail despite our best efforts. This can mean further treatment, for example referral to a root canal specialist (private cost) or the tooth might need to be taken out.',
        )
      )
    ),
  },

  // 21 — Root Canal Treatment Consent Form
  {
    key: 'root_canal_consent',
    name: 'Root Canal Treatment Consent Form',
    category: 'Endodontics',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Root Canal Treatment Consent Form',
      sec('Risks of Endodontic Treatment',
        ul(
          'I understand that many factors contribute to the success of root canal treatment and not all factors can be determined in advance. Some of the factors are: my resistance to infection; the bacteria causing the infection; the size, shape and location of the canals.',
          'I understand my case may be more difficult if my tooth has blocked, curved or narrow canals.',
          'I understand that root canal treatment may not relieve my symptoms and treatment can sometimes fail for unexplained reasons. If treatment fails, other procedures (including re-treatment or surgery) may be necessary to retain the tooth or it may have to be extracted.',
          'I understand that during and after treatment, I may experience some pain or discomfort, swelling, bleeding and loosening of dental restorations. I may also need antibiotics to treat any associated infections.',
          'I understand that root canal instruments sometimes separate (break) inside the canal which may or may not affect the prognosis. If the separated fragment cannot be retrieved, the tooth options are limited to extraction or seeking a specialist to treat the tooth however the success of this is not guaranteed.',
          'Should I wish to be referred to a specialist I understand I will be subject to costs not covered by the treatment paid for at this practice.',
          'I understand that other risks include perforation by the instrument, sinus perforation and/or nerve disturbances.',
          'I understand that once root canal treatment is completed, I must have a permanent restoration placed by my regular dentist within a few weeks. If I fail to have the tooth restored, I risk a failure of the root canal treatment, decay, infection, tooth fracture and/or loss of the tooth.',
          'I acknowledge that I have provided an accurate medical history, will follow treatment recommendations and have had the opportunity to ask questions about these risks in continuing with root canal treatment.',
          'I understand that a crown will be required after the root canal treatment or else there is a risk of fracture leading to possible loss of the tooth. Should I not wish to have a crown I understand and accept these risks.',
        )
      )
    ),
  },

  // 22 — Temp Filling Consent Form
  {
    key: 'temp_filling_consent',
    name: 'Temp Filling Consent Form',
    category: 'Restorative',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Temporary Filling Consent',
      p('Restorative dentistry involves the restoration of decayed and/or broken down teeth with materials such as composite resin, glass ionomer, and/or ceramic. Fillings are indicated when there is sufficient healthy tooth structure to support them. Often it is not known how much healthy tooth structure remains until after the old filling and recurrent decay are removed. If more than half the tooth has been lost, it is likely that a crown will be indicated or in the worst case removal of the tooth.') +
      p('It is important to realise that all restorative dentistry requires maintenance; no filling or crown will last forever. Fillings typically last about 5 years, while crowns typically last much longer. Excellent oral hygiene (daily flossing, brushing 2x/day), careful chewing (avoiding hard foods) and avoidance of potentially harmful habits (gum chewing, nail biting, etc.) will increase the longevity of a restoration.') +
      p('Whenever a tooth receives a filling or any other restoration — inflammation occurs within and around the tooth. If this inflammation is within the body\'s ability to control, only a little temporary discomfort will occur. If the inflammation exceeds the body\'s ability to control, the tooth may then require root canal treatment or extraction in the worst case. There is no way to predict a specific tooth\'s response prior to a procedure.') +
      sec('Risks Include:',
        ul(
          '<strong>Sensitivity of teeth:</strong> Often after preparation of teeth for the placement of any restoration, the prepared teeth may exhibit sensitivity. The sensitivity can be mild or severe. If such sensitivity is persistent or lasts for an extended period of time, notify the dentist as this can be a sign of more serious problems.',
          '<strong>Risk of fracture:</strong> Inherent in the placement or replacement of any restoration is the possibility of the creation of small fracture lines in the tooth structure.',
          '<strong>Necessity for root canal therapy:</strong> When fillings are placed or replaced, the preparation of the teeth may lead to exposure or trauma to underlying pulp tissue. Should the pulp not heal, root canal treatment or extraction may be required.',
          '<strong>Injury to the nerves:</strong> There is a possibility of injury to the nerves of the lips, jaws, teeth, tongue or other oral or facial tissues. The resulting numbness that can occur is usually temporary, but in rare instances it could be permanent.',
          '<strong>Breakage, dislodgement or bond failure:</strong> Because of extreme masticatory (chewing) pressures or other traumatic forces, the filling can fail.',
        )
      ) +
      p('I have been given the opportunity to ask any questions regarding the nature and purpose of fillings and have received answers to my satisfaction.')
    ),
  },

  // 23 — Wisdom Tooth Extraction Consent
  {
    key: 'wisdom_tooth_extraction_consent',
    name: 'Wisdom Tooth Extraction Consent',
    category: 'Oral Surgery',
    signatureCoordinates: { x: 60, y: 680, width: 200, height: 60, page: 1 },
    htmlContent: wrap('Wisdom Tooth Extraction Consent',
      p('I understand that the extraction of tooth/teeth has been recommended by my dentist. I have had alternative (if any) treatment explained to myself, as well as the consequences of doing no treatment. I also understand that there are risks associated with the extraction procedure as outlined below:') +
      ul(
        '<strong>Swelling, Bruising & Pain:</strong> These can occur with any surgery and vary from patient to patient and from one surgery to another.',
        '<strong>Trismus:</strong> This is a limited opening of the jaw due to inflammation and/or swelling in the muscles. This is most common with impacted tooth removal.',
        '<strong>TMJ Dysfunction:</strong> The jaw joint (temporomandibular joint) may not function properly and, although rare, may require treatment ranging from use of heat and rest to further surgery.',
        '<strong>Infection:</strong> This is possible with any surgical procedure and may require further surgery and/or medications if it does occur.',
        '<strong>Bleeding:</strong> Although significant bleeding can occur during or after surgery it is not common. Some bleeding is, however, usual for most surgeries and is normally controlled by following the post-op instruction sheet.',
        '<strong>Damage to Other Fillings and/or Teeth:</strong> Due to the close proximity of teeth, it is possible to damage other teeth and/or fillings when a tooth is removed.',
        '<strong>Dry Socket:</strong> A significant pain in the jaw and ear due to loss of the blood clot. Most commonly occurs after the removal of lower wisdom teeth. This may require additional office visits to treat.',
        '<strong>Sharp Ridges or Bone Splinters:</strong> Occasionally, after an extraction, the edge of the socket will be sharp or a bone splinter will come out through the gum. This may require surgery to smooth or remove the bone splinter.',
        '<strong>Incomplete Removal of Tooth Fragments:</strong> There are times the doctor may decide to leave in a fragment or root of a tooth in order to avoid doing damage to adjacent structures such as nerves and sinuses.',
        '<strong>Sinus Communication (oro-antral communication):</strong> A communication (hole) between the mouth and the maxillary sinus. This sometimes happens when an upper molar, wisdom or premolar tooth is extracted. To resolve this, stitches may be required or a referral to a specialist.',
        '<strong>Tuberosity Fracture:</strong> A potential complication of routine extraction of posterior maxillary (upper molar) teeth. On rare occasions would create a sinus communication.',
        '<strong>Nerve Damage:</strong> This risk is more significant in the extraction of posterior mandibular (lower molar) teeth. Damage to the inferior dental nerve can result in temporary or permanent loss of sensation and/or taste to the affected side. Symptoms may include numbness, tingling or a burning sensation.',
        '<strong>Need for a Coronectomy:</strong> A coronectomy involves the removal of only the crown (upper portion) of a tooth while leaving the roots intact. This procedure is typically performed on impacted or partially erupted wisdom teeth when the roots are in close proximity to vital structures such as nerves. Whilst a coronectomy is generally considered safe, complications may still occur including infection, incomplete removal of the crown, or issues with the retained roots necessitating further intervention.',
      )
    ),
  },

]

// ---------------------------------------------------------------------------
// Table check helper
// ---------------------------------------------------------------------------

async function hasConsentFormTemplatesTable() {
  try {
    const schema = sequelize?.options?.define?.schema || null
    const queryInterface = sequelize.getQueryInterface()
    await queryInterface.describeTable(
      schema ? { tableName: 'ConsentFormTemplates', schema } : 'ConsentFormTemplates'
    )
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function seedConsentFormTemplates() {
  if (_seedAttempted) return { status: 'skipped', reason: 'already_attempted' }
  _seedAttempted = true

  const hasTable = await hasConsentFormTemplatesTable()
  if (!hasTable) {
    console.log('ConsentFormTemplates table not found. Skipping consent form seed.')
    return { status: 'skipped', reason: 'missing_table' }
  }

  let created = 0
  let updated = 0

  for (const form of SYSTEM_CONSENT_FORMS) {
    const existing = await ConsentFormTemplate.findOne({
      where: { scope: 'system', key: form.key },
    })

    if (!existing) {
      await ConsentFormTemplate.create({
        scope: 'system',
        key: form.key,
        name: form.name,
        category: form.category,
        htmlContent: form.htmlContent,
        signatureCoordinates: form.signatureCoordinates,
        isActive: true,
        organisationId: null,
        createdBy: null,
      })
      created++
      continue
    }

    const needsUpdate =
      existing.name !== form.name ||
      existing.category !== form.category ||
      existing.htmlContent !== form.htmlContent

    if (needsUpdate) {
      await existing.update({
        name: form.name,
        category: form.category,
        htmlContent: form.htmlContent,
      })
      updated++
    }
  }

  console.log(`Consent form seed complete — created: ${created}, updated: ${updated}`)
  return { status: 'seeded', created, updated }
}
