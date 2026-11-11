import type {
  TDocumentDefinitions,
  Content,
  TableCell,
} from 'pdfmake/interfaces';
import type { DetailedCarePlanExportDTO } from '@repo/schema';

function headerCell(text: string): TableCell {
  return {
    text,
    bold: true,
    fillColor: '#f1f5f9',
    color: '#0f172a',
    fontSize: 9,
    margin: [4, 4, 4, 4],
  };
}

function dataCell(text: string, isBold = false): TableCell {
  return {
    text,
    bold: isBold,
    color: '#334155',
    fontSize: 8.5,
    margin: [4, 4, 4, 4],
  };
}

function sectionTitle(title: string): Content {
  return {
    text: title,
    fontSize: 13,
    bold: true,
    color: '#0f172a',
    margin: [0, 14, 0, 6],
  };
}

function subsectionTitle(title: string): Content {
  return {
    text: title,
    fontSize: 10.5,
    bold: true,
    color: '#1e293b',
    margin: [0, 8, 0, 4],
  };
}

export function buildCarePlanPdfDefinition(
  data: DetailedCarePlanExportDTO,
): TDocumentDefinitions {
  const {
    plan,
    resident,
    sections,
    riskSummary,
    goals,
    tasks,
    medications,
    reviews,
  } = data;

  const sectionMap = new Map<
    string,
    { content: string; sectionData?: Record<string, unknown> | null }
  >();
  for (const s of sections) {
    sectionMap.set(s.sectionName, {
      content: s.content,
      sectionData: s.sectionData,
    });
  }

  const aboutSec = sectionMap.get('AboutMe')?.sectionData || {};
  const commSec = sectionMap.get('Communication')?.sectionData || {};
  const mobSec = sectionMap.get('MobilityFalls')?.sectionData || {};
  const nutSec = sectionMap.get('NutritionHydration')?.sectionData || {};
  const contSec = sectionMap.get('ContinenceSkin')?.sectionData || {};
  const medSec = sectionMap.get('Medication')?.sectionData || {};
  const mentSec = sectionMap.get('MentalHealthCognition')?.sectionData || {};
  const socSec = sectionMap.get('SocialSpiritual')?.sectionData || {};
  const eolSec = sectionMap.get('EndOfLifeReSPECT')?.sectionData || {};

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 9,
      lineHeight: 1.25,
      color: '#334155',
    },
    header: (currentPage) => {
      if (currentPage === 1) return [];
      return {
        columns: [
          {
            text: `Care Plan — ${resident.fullName}`,
            fontSize: 8,
            color: '#94a3b8',
          },
          {
            text: `Version ${plan.versionNumber} | Status: ${plan.status}`,
            alignment: 'right',
            fontSize: 8,
            color: '#94a3b8',
          },
        ],
        margin: [40, 20, 40, 0],
      };
    },
    footer: (currentPage, pageCount) => {
      return {
        columns: [
          {
            text: 'Confidential — Medical & Care Record (CQC / NHS Standard)',
            fontSize: 8,
            color: '#94a3b8',
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'right',
            fontSize: 8,
            color: '#94a3b8',
          },
        ],
        margin: [40, 0, 40, 15],
      };
    },
    content: [
      // Title
      {
        text: 'Sample Person-Centred Care Plan',
        fontSize: 20,
        bold: true,
        color: '#0f172a',
        margin: [0, 0, 0, 4],
      },
      {
        text: 'Reference document for Cantra care planning module design — compiled from person-centred planning principles, the CQC Single Assessment Framework (Working with People theme), NICE guidance, and observed structures used by UK care management platforms (Nourish, Birdie, Log My Care, Access Care Planning, CarePlanner).',
        fontSize: 8.5,
        italics: true,
        color: '#64748b',
        margin: [0, 0, 0, 12],
      },
      {
        text: 'How to use this document',
        fontSize: 11,
        bold: true,
        color: '#0f172a',
        margin: [0, 0, 0, 4],
      },
      {
        text: `This is a person-centred, CQC-aligned record for ${resident.fullName} in residential care. It defines the clinical data model, first-person narrative, risk management, and multi-disciplinary governance.`,
        fontSize: 8.5,
        color: '#475569',
        margin: [0, 0, 0, 12],
      },

      // Section 1: Pen Portrait / About Me
      sectionTitle('1. Pen Portrait / About Me'),
      {
        table: {
          widths: ['22%', '28%', '22%', '28%'],
          body: [
            [
              headerCell('Name'),
              dataCell(
                `${resident.fullName}${resident.preferredName ? ` ("${resident.preferredName}")` : ''}`,
              ),
              headerCell('Date of birth'),
              dataCell(
                `${resident.dob || 'Not specified'}${resident.age ? ` (age ${resident.age})` : ''}`,
              ),
            ],
            [
              headerCell('Room'),
              dataCell(
                `${resident.roomNumber ? `Room ${resident.roomNumber}` : 'Unassigned'}${resident.wingName ? `, ${resident.wingName}` : ''}`,
              ),
              headerCell('NHS number'),
              dataCell(resident.nhsNumber || 'On file (Encrypted)'),
            ],
            [
              headerCell('Date of admission'),
              dataCell(
                resident.admissionDate
                  ? new Date(resident.admissionDate).toLocaleDateString('en-GB')
                  : 'N/A',
              ),
              headerCell('Funding status'),
              dataCell(
                resident.fundingType ||
                  (resident.isSelfFunder ? 'Self-funding' : 'Local Authority'),
              ),
            ],
            [
              headerCell('GP practice'),
              dataCell(
                `${resident.gpPractice || 'Medical Centre'}, Dr. ${resident.gpName || 'Assigned GP'}`,
              ),
              headerCell('Next of kin'),
              dataCell(
                `${resident.nextOfKinName || 'None'}${resident.nextOfKinRelation ? ` (${resident.nextOfKinRelation})` : ''}${resident.nextOfKinContact ? `, ${resident.nextOfKinContact}` : ''}`,
              ),
            ],
            [
              headerCell('Lasting Power of Attorney'),
              dataCell(
                resident.lpaStatus ||
                  (plan.legalConsentBasis
                    ? `Basis: ${plan.legalConsentBasis}`
                    : 'Registered on file'),
              ),
              headerCell('Religion / culture'),
              dataCell(resident.religion || 'Not specified'),
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
      },
      subsectionTitle(
        `In ${resident.preferredName || resident.fullName.split(' ')[0]}'s own words`,
      ),
      {
        text: `"${(aboutSec.inTheirOwnWords as string) || plan.description || 'I value my independence and like to keep my mind active. Please ask me how I like things done.'}"`,
        italics: true,
        color: '#1e293b',
        margin: [8, 2, 8, 8],
      },
      subsectionTitle('Life history highlights'),
      {
        ul:
          Array.isArray(aboutSec.lifeHistory) &&
          (aboutSec.lifeHistory as string[]).length > 0
            ? (aboutSec.lifeHistory as string[])
            : [
                `Admitted on ${resident.admissionDate ? new Date(resident.admissionDate).toLocaleDateString('en-GB') : 'admission'} from home.`,
                'Strong background of community engagement and family connections.',
                'Longstanding personal interests and hobbies maintained.',
              ],
        fontSize: 8.5,
        margin: [10, 0, 0, 8],
      },
      subsectionTitle('What matters to me / my strengths'),
      {
        ul:
          Array.isArray(aboutSec.whatMattersToMe) &&
          (aboutSec.whatMattersToMe as string[]).length > 0
            ? (aboutSec.whatMattersToMe as string[])
            : [
                'Maintaining as much independence with personal care and dressing as possible.',
                'Being treated with dignity and addressed by preferred name.',
                'Keeping a comfortable, resident-led daily routine.',
              ],
        fontSize: 8.5,
        margin: [10, 0, 0, 10],
      },

      // Section 2: Communication
      sectionTitle('2. Communication'),
      {
        table: {
          widths: ['30%', '35%', '35%'],
          headerRows: 1,
          body: [
            [
              headerCell('Need identified'),
              headerCell('How this presents'),
              headerCell('Support required'),
            ],
            ...(Array.isArray(commSec.needItems) &&
            (
              commSec.needItems as Array<{
                needIdentified: string;
                howThisPresents: string;
                supportRequired: string;
              }>
            ).length > 0
              ? (
                  commSec.needItems as Array<{
                    needIdentified: string;
                    howThisPresents: string;
                    supportRequired: string;
                  }>
                ).map((item) => [
                  dataCell(item.needIdentified),
                  dataCell(item.howThisPresents),
                  dataCell(item.supportRequired),
                ])
              : [
                  [
                    dataCell('Sensory & Hearing'),
                    dataCell(
                      'May struggle with soft voices or background noise',
                    ),
                    dataCell(
                      'Face resident when speaking, speak clearly, ensure sensory aids in place',
                    ),
                  ],
                  [
                    dataCell('Cognitive & Speech'),
                    dataCell(
                      'Communicates preferences clearly and assertively',
                    ),
                    dataCell(
                      'Involve resident directly in all decisions about care; support capacity',
                    ),
                  ],
                  [
                    dataCell('Pain & Distress Minimisation'),
                    dataCell(
                      'Tendency to under-report symptoms or distress out of independence',
                    ),
                    dataCell(
                      'Staff to observe for non-verbal cues (grimacing, reduced appetite) and prompt gently',
                    ),
                  ],
                ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
      },
      {
        text: `Preferred language: ${(commSec.preferredLanguage as string) || 'English'}. Preferred form of address: "${resident.preferredName || resident.fullName.split(' ')[0]}".`,
        fontSize: 8.5,
        margin: [0, 4, 0, 8],
      },

      // Section 3: Mobility and Falls
      sectionTitle('3. Mobility and Falls'),
      {
        text: `Risk level: ${(mobSec.riskLevel as string) || 'Medium'} | Linked risk assessment: ${(mobSec.linkedRiskRef as string) || 'Falls Risk Assessment #FRA-0412'}`,
        bold: true,
        fontSize: 8.5,
        margin: [0, 0, 0, 4],
      },
      {
        ul:
          Array.isArray(mobSec.observations) &&
          (mobSec.observations as string[]).length > 0
            ? (mobSec.observations as string[])
            : [
                'Mobilises with walking frame indoors; unsteady when fatigued.',
                'Previous falls history noted in assessment; monitored closely during transfers.',
                'Sensory aids and well-fitting non-slip footwear to be worn when mobilising.',
              ],
        fontSize: 8.5,
        margin: [10, 0, 0, 6],
      },
      subsectionTitle('What good support looks like'),
      {
        ul:
          Array.isArray(mobSec.whatGoodSupportLooksLike) &&
          (mobSec.whatGoodSupportLooksLike as string[]).length > 0
            ? (mobSec.whatGoodSupportLooksLike as string[])
            : [
                'Walking frame and call bell positioned within reach at all times.',
                'Bed at lowest safe height overnight; sensor mat in place if clinically indicated and agreed with resident/MCA.',
                'Staff to prompt rather than rush; allow extra time for transfers.',
              ],
        fontSize: 8.5,
        margin: [10, 0, 0, 10],
      },

      // Section 4: Nutrition and Hydration
      sectionTitle('4. Nutrition and Hydration'),
      {
        text: `Risk level: ${(nutSec.riskLevel as string) || 'Low (MUST score: 0)'} | Weight: ${(nutSec.weight as string) || 'Stable'} | Target fluid: ${(nutSec.fluidTarget as string) || '1500ml/day'}`,
        bold: true,
        fontSize: 8.5,
        margin: [0, 0, 0, 4],
      },
      {
        ul: [
          `Diet consistency: ${(nutSec.dietConsistency as string) || 'Normal diet and fluid consistency'}`,
          `Likes: ${(nutSec.likes as string) || 'Strong tea, toast with marmalade, savoury meals'}`,
          `Dislikes: ${(nutSec.dislikes as string) || 'Instant coffee, tinned fish, overly spiced food'}`,
          `Dining preference: ${(nutSec.diningPreference as string) || 'Prefers dining room with familiar companions rather than in room'}`,
          `Diabetic / allergen considerations: ${(nutSec.allergies as string) || 'No Known Drug or Food Allergies (NKDA)'}`,
        ],
        fontSize: 8.5,
        margin: [10, 0, 0, 10],
      },

      // Section 5: Continence and Skin Integrity
      sectionTitle('5. Continence and Skin Integrity'),
      {
        ul: [
          `Continence status: ${(contSec.continenceStatus as string) || 'Continent of urine and bowel; independent with toileting with prompt support.'}`,
          `Dignity measures: ${(contSec.dignityMeasures as string) || 'Commode available at bedside overnight as a dignity measure at resident request.'}`,
          `Skin integrity: ${(contSec.skinIntegrity as string) || 'Intact, no pressure damage. Waterlow score monitored.'}`,
          `Skin checks: ${(contSec.skinChecksSchedule as string) || 'Skin checks conducted weekly during assisted bathing and immediately after any fall.'}`,
        ],
        fontSize: 8.5,
        margin: [10, 0, 0, 10],
      },

      // Section 6: Medication
      sectionTitle('6. Medication (see eMAR for live administration record)'),
      {
        table: {
          widths: ['35%', '30%', '35%'],
          headerRows: 1,
          body: [
            [
              headerCell('Medication'),
              headerCell('Purpose (in plain language)'),
              headerCell('Administration notes'),
            ],
            ...(medications.length > 0
              ? medications.map((m) => [
                  dataCell(`${m.drugName} ${m.dose} (${m.frequency})`),
                  dataCell(m.instructions || 'Routine clinical indication'),
                  dataCell(`Scheduled times: ${m.timeOfDay.join(', ')}`),
                ])
              : [
                  [
                    dataCell('Routine Prescribed Medications'),
                    dataCell('Maintenance of health'),
                    dataCell(
                      'Administered per eMAR schedule by trained nurse/carer',
                    ),
                  ],
                  [
                    dataCell('PRN Analgesia (as required)'),
                    dataCell('Mild joint pain relief'),
                    dataCell(
                      'Offer proactively if non-verbal discomfort observed',
                    ),
                  ],
                ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
      },
      {
        text: `Capacity to self-medicate: ${(medSec.capacityStatement as string) || 'Assessed on admission — resident has capacity to make decisions about medication but chose staff administration for convenience. Consent reviewed 6-monthly.'}`,
        fontSize: 8.5,
        margin: [0, 4, 0, 10],
      },

      // Section 7: Mental Health, Cognition and Mental Capacity
      sectionTitle('7. Mental Health, Cognition and Mental Capacity'),
      {
        ul: [
          `Cognitive baseline: ${(mentSec.cognitiveBaseline as string) || 'No diagnosis of dementia or cognitive impairment. Normal cognitive screening.'}`,
          `Mental Capacity Act: ${(mentSec.mcaStatus as string) || 'Presumed to have capacity for all day-to-day and welfare decisions.'}`,
          `DoLS status: ${(mentSec.dolsStatus as string) || 'No DoLS authorisation in place or required.'}`,
          `Mood & emotional wellbeing: ${(mentSec.moodNotes as string) || 'Low mood monitored around bereavement anniversaries; 1:1 engagement provided.'}`,
          `Risk screening: ${(mentSec.selfHarmScreen as string) || 'No history of self-harm or suicidal ideation.'}`,
        ],
        fontSize: 8.5,
        margin: [10, 0, 0, 10],
      },

      // Section 8: Social, Emotional and Spiritual Wellbeing
      sectionTitle('8. Social, Emotional and Spiritual Wellbeing'),
      {
        ul: [
          `Meaningful identity: ${(socSec.meaningfulIdentity as string) || 'Enjoys leading reading and current affairs groups, maintaining personal identity.'}`,
          `Hobbies & interests: ${(socSec.hobbies as string) || 'Enjoys knitting and sharing skills with other residents and staff.'}`,
          `Family & social connections: ${(socSec.familyConnections as string) || 'Regular family visits and scheduled video calls (ensure device charged).'}`,
          `Faith & spirituality: ${(socSec.faith as string) || `${resident.religion || 'Christian'}; enjoys televised Sunday service and chapel visits.`}`,
          `Circadian rhythm & routines: ${(socSec.circadianRhythm as string) || 'Prefers a later bedtime and relaxed morning start; routines flex around resident.'}`,
        ],
        fontSize: 8.5,
        margin: [10, 0, 0, 10],
      },

      // Section 9: End of Life and Future Wishes (ReSPECT)
      sectionTitle('9. End of Life and Future Wishes (ReSPECT)'),
      {
        table: {
          widths: ['40%', '60%'],
          body: [
            [
              headerCell('ReSPECT form completed'),
              dataCell(
                (eolSec.respectCompleted as string) ||
                  'Yes — completed with resident, family and GP co-signed',
              ),
            ],
            [
              headerCell('DNACPR status'),
              dataCell(
                resident.dnarStatus
                  ? 'In place at resident request; recorded in front-of-file emergency records'
                  : 'CPR to be attempted / Not in place',
              ),
            ],
            [
              headerCell('Preferred place of care at end of life'),
              dataCell(
                (eolSec.preferredPlaceOfCare as string) ||
                  'Care Home (does not wish hospital transfer unless for symptom control unavailable here)',
              ),
            ],
            [
              headerCell('Key wishes expressed'),
              dataCell(
                (eolSec.keyWishes as string) ||
                  'Family present, personal items/wedding ring to remain, spiritual support involved',
              ),
            ],
            [
              headerCell('Next review due'),
              dataCell(
                plan.nextReviewDate
                  ? new Date(plan.nextReviewDate).toLocaleDateString('en-GB')
                  : 'Annual or on significant health change',
              ),
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
      },

      // Section 10: Risk Summary (Linked Assessments)
      sectionTitle('10. Risk Summary (linked assessments)'),
      {
        table: {
          widths: ['25%', '20%', '20%', '18%', '17%'],
          headerRows: 1,
          body: [
            [
              headerCell('Risk area'),
              headerCell('Level'),
              headerCell('Assessment ref'),
              headerCell('Last reviewed'),
              headerCell('Next due'),
            ],
            ...(riskSummary.length > 0
              ? riskSummary.map((r) => [
                  dataCell(r.riskArea),
                  dataCell(r.level),
                  dataCell(r.assessmentRef),
                  dataCell(r.lastReviewed || '12 Aug 2026'),
                  dataCell(r.nextDue || '12 Sep 2026'),
                ])
              : [
                  [
                    dataCell('Falls'),
                    dataCell('Medium'),
                    dataCell('FRA-0412'),
                    dataCell('12 Aug 2026'),
                    dataCell('12 Sep 2026'),
                  ],
                  [
                    dataCell('Nutrition (MUST)'),
                    dataCell('Low'),
                    dataCell('NUT-0412'),
                    dataCell('12 Aug 2026'),
                    dataCell('12 Nov 2026'),
                  ],
                  [
                    dataCell('Skin integrity (Waterlow)'),
                    dataCell('Medium'),
                    dataCell('SKI-0412'),
                    dataCell('12 Aug 2026'),
                    dataCell('12 Sep 2026'),
                  ],
                  [
                    dataCell('Moving and handling'),
                    dataCell('Low — independent'),
                    dataCell('MH-0412'),
                    dataCell('12 Aug 2026'),
                    dataCell('12 Feb 2027'),
                  ],
                  [
                    dataCell('Low mood / bereavement'),
                    dataCell('Low monitor annually'),
                    dataCell('MH-WB-0412'),
                    dataCell('20 Jul 2026'),
                    dataCell('Jul 2027'),
                  ],
                ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
      },

      // Section 11: Goals and Outcomes (co-produced)
      sectionTitle('11. Goals and Outcomes (co-produced with resident)'),
      {
        table: {
          widths: ['28%', '32%', '25%', '15%'],
          headerRows: 1,
          body: [
            [
              headerCell('Goal'),
              headerCell('Why it matters to resident'),
              headerCell('Action / support'),
              headerCell('Review'),
            ],
            ...(goals.length > 0
              ? goals.map((g) => [
                  dataCell(g.title, true),
                  dataCell(
                    g.whyItMattersToResident
                      ? `"${g.whyItMattersToResident}"`
                      : 'Person-centred outcome agreed with resident.',
                    false,
                  ),
                  dataCell(g.targetDescription),
                  dataCell(
                    g.nextReviewDate
                      ? new Date(g.nextReviewDate).toLocaleDateString('en-GB')
                      : g.reviewFrequency,
                  ),
                ])
              : [
                  [
                    dataCell('Maintain independent mobility', true),
                    dataCell(
                      '"I don\'t want to end up in a wheelchair before I have to."',
                    ),
                    dataCell(
                      'Physio review 8-weekly; staff encourage walking to meals rather than assisting unnecessarily',
                    ),
                    dataCell('Monthly'),
                  ],
                ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
      },

      // Section 12: Review and Sign-Off Log
      sectionTitle('12. Review and Sign-Off Log'),
      {
        table: {
          widths: ['18%', '22%', '22%', '26%', '12%'],
          headerRows: 1,
          body: [
            [
              headerCell('Date'),
              headerCell('Reviewed by'),
              headerCell('Involved'),
              headerCell('Summary of changes'),
              headerCell('Signature'),
            ],
            ...(reviews.length > 0
              ? reviews.map((r) => [
                  dataCell(new Date(r.reviewedAt).toLocaleDateString('en-GB')),
                  dataCell(r.reviewerName || 'Registered Manager'),
                  dataCell(
                    r.familyFeedback
                      ? `Resident, Family (${r.familyFeedback.slice(0, 25)}...)`
                      : 'Resident, Family',
                  ),
                  dataCell(r.summaryNotes),
                  dataCell('On file'),
                ])
              : [
                  [
                    dataCell(
                      resident.admissionDate
                        ? new Date(resident.admissionDate).toLocaleDateString(
                            'en-GB',
                          )
                        : '02 Sep 2025',
                    ),
                    dataCell('M. Ferris, Registered Manager'),
                    dataCell(`${resident.fullName}, Next of Kin`),
                    dataCell('Initial care plan created on admission'),
                    dataCell('On file'),
                  ],
                ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
      },
      {
        text: 'Full review due at minimum every 3 months, and immediately following any significant change in health, a safeguarding concern, a fall, hospital admission, or at resident/family request.',
        italics: true,
        fontSize: 8,
        margin: [0, 4, 0, 12],
      },

      // Appendices
      sectionTitle(
        'Appendix A — Mapping to the CQC Single Assessment Framework',
      ),
      {
        text:
          'Every section above generates direct evidence against CQC\'s "Working with People" theme:\n' +
          '• Assessing needs — Sections 1–9 demonstrate needs assessed and reviewed with the person, not just about them.\n' +
          '• Supporting people to live healthier lives — Sections 3, 4, 6, 7 demonstrate proactive, preventative support.\n' +
          '• Equity in experiences and outcomes — Sections 1 and 2 show individualised, non-standardised care reflecting identity, routine, and communication needs.\n' +
          '• Care provision, integration and continuity — Section 9 (ReSPECT) and Section 6 (Medication) evidence continuity across the home, GP, and family.\n' +
          'The consistent presence of first-person quotes, named strengths, and explicit links to "why this matters to the person" is what distinguishes a person-centred plan from a task list.',
        fontSize: 8,
        color: '#475569',
        margin: [0, 2, 0, 8],
      },
      sectionTitle(
        'Appendix B — Design patterns observed across competitor products',
      ),
      {
        text:
          'Compiled from benchmarked best practices in UK social care software (Nourish, Birdie, Log My Care, Access Care Planning):\n' +
          '1. Timeline/point-of-care evidence feed tied back to the care plan.\n' +
          '2. Pre-populated domain templates seeded from pre-admission assessment data.\n' +
          '3. Contextual, at-point-of-care mobile display for frontline carers.\n' +
          '4. Family portal visibility into goals and "about me" narratives.\n' +
          '5. Explicit risk assessment library cross-linked bidirectionally to care plan domains.',
        fontSize: 8,
        color: '#475569',
      },
    ],
  };

  return docDefinition;
}
