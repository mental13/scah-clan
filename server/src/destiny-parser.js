var exports = module.exports = {};

// These functions receive the whole data payload from the destiny API and parse it for specific stuff that is
// required to aquire a particular role and will return this data in the following format:
// name: the name of the role
// triumphs: an array of triumphs
//  name: name of the triumph
//  description: flavour text
//  iconPath: URI for an icon from Bungie
//  isComplete: if all objectives are complete this will be true, false otherwise
//  objectives: an array of objectives
//    hint: short descriptive string
//    isComplete: if curValue >= reqValue this will be true, false otherwise
//    curValue: current progress
//    reqValue: required value
//    collectionProgress: contains a list of items and their state

exports.parseTriumphant = function(destinyData) {
  const triumphScore = destinyData.profileRecords.data.score;
  const profileSealsIds = [
    3170835069, // Shadow
    991908404,  // Reckoner
    3481101973, // Dredgen
    2588182977, // Wayfarer
    147928983,  // Unbroken
    2693736750, // Chronicler
    2516503814, // Cursebreaker
    1162218545, // Rivensbane
  ];
  const charSealsIds = [
    2039028930, // Blacksmith
    1002334440, // MMXIX Note: this ones buged and returns 24/25 when completed
  ];

  const charId = destinyData.profile.data.characterIds[0];

  let sealsCompleted = 0;
  profileSealsIds.forEach(sealId => {
    console.log(sealId)
    const sealNode = destinyData.profilePresentationNodes.data.nodes[sealId];

    if (sealNode.progressValue >= sealNode.completionValue)
      sealsCompleted++;
  });

  charSealsIds.forEach(sealId => {
    console.log(sealId)
    const sealNode = destinyData.characterPresentationNodes.data[charId].nodes[sealId];

    // temp workaround
    if (sealId == 1002334440)
      sealNode.completionValue--;

    if (sealNode.progressValue >= sealNode.completionValue)
      sealsCompleted++;
  });

  const objective_1 = {
    hint: 'Score',
    isComplete: triumphScore >= 80000,
    curValue: triumphScore,
    reqValue: 80000
  }

  const objective_2 = {
    hint: 'Seals',
    isComplete: sealsCompleted >= 3,
    curValue: sealsCompleted,
    reqValue: 3
  }

  return {
    name: 'Triumphant',
    triumphs: [
      {
        name: 'Score',
        description: 'Score',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/3b023bac8a0959be3c0791ecbcf3c5ec.png',
        isComplete: objective_1.isComplete,
        objectives: [
          objective_1
        ]
      },
      {
        name: 'Seals',
        description: 'Seals',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/23599621d4c63076c647384028d96ca4.png',
        isComplete: objective_2.isComplete,
        objectives: [
          objective_2
        ]
      }
    ]
  }
}
