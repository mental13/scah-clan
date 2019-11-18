var exports = module.exports = {};

const manifest = require('./manifest');

// These functions receive the whole data payload from the destiny API and parse it for specific stuff that is
// required to aquire a particular title and will return this data in the following format:
// name: the name of the title
// isRedeemable: if all triumphs are complete this will be true, false otherwise
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
//      icon: item icon
//      isAquired: true if collectible was aquired

const RecordStatus = {
  COMPLETED: 1,
  NOT_COMPLETED: 4
}

const CollectibleStatus = {
  NOT_ACQUIRED: 1
}

function isCollectibleAquired(destinyData, id) {
  return !(destinyData.profileCollectibles.data.collectibles[id].state & CollectibleStatus.NOT_ACQUIRED);
}

exports.calculateProfilePower = async function (destinyData) {
  return await manifest.getMaxPowerItems(destinyData);
}

exports.parseMaxed = function (profilePower) {
}

exports.parseAscendant = function (profilePower) {
}

exports.parseTriumphant = function (destinyData) {
  const triumphScore = destinyData.profileRecords.data.score;
  const sealsIds = [
    3170835069, // Shadow
    991908404,  // Reckoner
    2039028930, // Blacksmith
    3481101973, // Dredgen
    2588182977, // Wayfarer
    147928983,  // Unbroken
    2693736750, // Chronicler
    2516503814, // Cursebreaker
    1162218545, // Rivensbane
    1002334440, // MMXIX Note: this one's buged and returns 24/25 when completed
  ];
  const charSealsIds = [

  ];

  const charId = destinyData.profile.data.characterIds[0];

  let sealsCompleted = 0;
  sealsIds.forEach(sealId => {
    const sealNode = destinyData.profilePresentationNodes.data.nodes[sealId];
    if (sealNode) {
      // workaround for MMXIX seal
      if (sealId == 1002334440)
        sealNode.completionValue--;

      if (sealNode.progressValue >= sealNode.completionValue)
        sealsCompleted++;
    }
  });

  const scoreObjective = {
    hint: 'Score',
    isComplete: triumphScore >= 80000,
    curValue: triumphScore,
    reqValue: 80000
  };

  const sealObjective = {
    hint: 'Seals',
    isComplete: sealsCompleted >= 3,
    curValue: sealsCompleted,
    reqValue: 3
  };

  const triumphs = [
    {
      name: 'Score',
      description: 'Score',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/3b023bac8a0959be3c0791ecbcf3c5ec.png',
      isComplete: scoreObjective.isComplete,
      objectives: [
        scoreObjective
      ]
    },
    {
      name: 'Seals',
      description: 'Seals',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/23599621d4c63076c647384028d96ca4.png',
      isComplete: sealObjective.isComplete,
      objectives: [
        sealObjective
      ]
    }
  ];

  return {
    name: 'Triumphant',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

exports.parseChosen = function (destinyData) {
  // Leviathan
  const lCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[3420353827].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[3420353827].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const lPrestigeObjective = {
    hint: 'Prestige Completed',
    isComplete: destinyData.profileRecords.data.records[940998165].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[940998165].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const lChallengeEmblemIds = [
    1766893932,
    1766893933,
    1766893934,
    1766893935
  ];

  let lChallengesCompleted = 0;
  lChallengeEmblemIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      lChallengesCompleted++;
  });

  const lChallengeObjective = {
    hint: 'Challenges Completed',
    isComplete: lChallengesCompleted >= 4,
    curValue: lChallengesCompleted,
    reqValue: 4
  };

  // Eater of Worlds
  const eowCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[2602370549].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[2602370549].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const eowPrestigeObjective = {
    hint: 'Prestige Completed',
    isComplete: destinyData.profileRecords.data.records[3861076347].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[3861076347].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  // Spire if Stars
  const sosCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[1742345588].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[1742345588].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const sosPrestigeObjective = {
    hint: 'Prestige Completed',
    isComplete: destinyData.profileRecords.data.records[2923250426].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[2923250426].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  // Last Wish
  const lwCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[2195455623].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[2195455623].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const lwClanObjective = {
    hint: 'Raid with Clanmates',
    isComplete: destinyData.profileRecords.data.records[613834558].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[613834558].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const lwChallengeIds = [
    2822000740,
    3899933775,
    2196415799,
    1672792871,
    149192209
  ];

  let lwChallengesCompleted = 0;
  lwChallengeIds.forEach(recordId => {
    if (destinyData.profileRecords.data.records[recordId].state & RecordStatus.COMPLETED)
      lwChallengesCompleted++;
  });

  const lwChallengeObjective = {
    hint: 'Challenges Completed',
    isComplete: lwChallengesCompleted >= 5,
    curValue: lwChallengesCompleted,
    reqValue: 5
  };

  // Scourge of the Past
  const sotpCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[4060320345].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[4060320345].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const sotpClanObjective = {
    hint: 'Raid with Clanmates',
    isComplete: destinyData.profileRecords.data.records[3758103712].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[3758103712].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const sotpChallengeIds = [
    4162926221,
    1428463716,
    1804999028
  ];

  let sotpChallengesCompleted = 0;
  sotpChallengeIds.forEach(recordId => {
    if (destinyData.profileRecords.data.records[recordId].state & RecordStatus.COMPLETED)
      sotpChallengesCompleted++;
  });

  const sotpChallengeObjective = {
    hint: 'Challenges Completed',
    isComplete: sotpChallengesCompleted >= 3,
    curValue: sotpChallengesCompleted,
    reqValue: 3
  };

  // Crown of Sorrows
  const cosCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[1558682421].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[1558682421].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const cosClanObjective = {
    hint: 'Raid with Clanmates',
    isComplete: destinyData.profileRecords.data.records[1558682423].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[1558682423].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  };

  const cosChallengeIds = [
    1575460002,
    1575460003,
    1575460004
  ];

  let cosChallengesCompleted = 0;
  cosChallengeIds.forEach(recordId => {
    if (destinyData.profileRecords.data.records[recordId].state & RecordStatus.COMPLETED)
      cosChallengesCompleted++;
  });

  const cosChallengeObjective = {
    hint: 'Challenges Completed',
    isComplete: cosChallengesCompleted >= 3,
    curValue: cosChallengesCompleted,
    reqValue: 3
  };

  // Garden of Salvation - SOON

  const triumphs = [
    {
      name: 'Last Wish',
      description: 'Last Wish',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/fc5791eb2406bf5e6b361f3d16596693.png',
      isComplete: lwCompleteObjective.isComplete && lwClanObjective.isComplete && lwChallengeObjective.isComplete,
      objectives: [
        lwCompleteObjective,
        lwClanObjective,
        lwChallengeObjective
      ]
    },
    {
      name: 'Scourge of the Past',
      description: 'Scourge of the Past',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/8b1bfd1c1ce1cab51d23c78235a6e067.png',
      isComplete: sotpCompleteObjective.isComplete && sotpClanObjective.isComplete && sotpChallengeObjective.isComplete,
      objectives: [
        sotpCompleteObjective,
        sotpClanObjective,
        sotpChallengeObjective
      ]
    },
    {
      name: 'Crown of Sorrows',
      description: 'Crown of Sorrows',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/decaf52ed74c6e66ae363fea24af2ba2.png',
      isComplete: cosCompleteObjective.isComplete && cosClanObjective.isComplete && cosChallengeObjective.isComplete,
      objectives: [
        cosCompleteObjective,
        cosClanObjective,
        cosChallengeObjective
      ]
    },
    {
      name: 'Leviathan',
      description: 'Leviathan',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/525ebce0b78615a94b62e5969afd1485.png',
      isComplete: lCompleteObjective.isComplete && lPrestigeObjective.isComplete && lChallengeObjective.isComplete,
      objectives: [
        lCompleteObjective,
        lPrestigeObjective,
        lChallengeObjective
      ]
    },
    {
      name: 'Eater of Worlds',
      description: 'Eater of Worlds',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/525ebce0b78615a94b62e5969afd1485.png',
      isComplete: eowCompleteObjective.isComplete && eowPrestigeObjective.isComplete,
      objectives: [
        eowCompleteObjective,
        eowPrestigeObjective
      ]
    },
    {
      name: 'Spire of Stars',
      description: 'Spire of Stars',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/525ebce0b78615a94b62e5969afd1485.png',
      isComplete: sosCompleteObjective.isComplete && sosPrestigeObjective.isComplete,
      objectives: [
        sosCompleteObjective,
        sosPrestigeObjective
      ]
    }
  ];

  return {
    name: 'Chosen',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

exports.parseConqueror = function (destinyData) {
  const crucibleId = 3882308435;
  const charId = destinyData.profile.data.characterIds[0];
  const seasonResetCount = destinyData.characterProgressions.data[charId].progressions[crucibleId].currentResetCount;

  const resetObjective = {
    hint: 'Resets',
    isComplete: seasonResetCount >= 3,
    curValue: seasonResetCount,
    reqValue: 3
  }

  const pinacleWeaponIds = [
    3260604718, // Lunas Howl
    4047371119, // Mountaintop
    2335550020, // Recluse
    1111219481, // Redrix
    3066162258, // Revoker
  ];

  let pinacleWeaponAquired = 0;
  pinacleWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      pinacleWeaponAquired++;
  });

  const collectionObjective = {
    hint: '',
    isComplete: pinacleWeaponAquired >= 4,
    curValue: pinacleWeaponAquired,
    reqValue: 4,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/848176acba2ececb3b06f222bccee406.jpg',
        isAquired: isCollectibleAquired(destinyData, 1111219481)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/ca86c130898a90ed19a0a317df8ab389.jpg',
        isAquired: isCollectibleAquired(destinyData, 3260604718)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/b372c65f81ad2d49196a6cec4e07704d.jpg',
        isAquired: isCollectibleAquired(destinyData, 4047371119)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/8f5bedcac2559d153f6df266d9f4d04b.jpg',
        isAquired: isCollectibleAquired(destinyData, 2335550020)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/929777eec5d64e8d26742bb2bf2ed63b.jpg',
        isAquired: isCollectibleAquired(destinyData, 3066162258)
      },
    ]
  };

  const exoticWeaponIds = [
    3074058273, // Last Word
    4009683574, // Thorn
    1660030047, // Chaperone
  ];

  let exoticWeaponAquired = 0;
  exoticWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      exoticWeaponAquired++;
  });

  const exoticObjective = {
    hint: '',
    isComplete: exoticWeaponAquired >= 2,
    curValue: exoticWeaponAquired,
    reqValue: 2,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/371ba66cb82c46cfd1e9cc098fa6371e.jpg',
        isAquired: isCollectibleAquired(destinyData, 3074058273)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/6481ca96bae1de44456ec24afb4e4881.jpg',
        isAquired: isCollectibleAquired(destinyData, 4009683574)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/375162673a9b04ff50562c0ae3a6f276.jpg',
        isAquired: isCollectibleAquired(destinyData, 1660030047)
      },
    ]
  };

  const triumphs = [
    {
      name: 'Valor Rank',
      description: 'Reset your Valor Rank 3 times in the active season',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/71c0b0cc81c1e92ce675c295a4a8e347.png',
      isComplete: resetObjective.isComplete,
      objectives: [
        resetObjective
      ]
    },
    {
      name: 'Pinacle Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/2565ae54801563abfefd78f8c2dd6463.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        collectionObjective
      ]
    },
    {
      name: 'Exotic Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/f0a13943dfd6f1bffd8f88e82381db8a.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        exoticObjective
      ]
    },
  ];

  return {
    name: 'Conqueror',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

exports.parseOutlaw = function (destinyData) {
  const gambitId = 2772425241;
  const charId = destinyData.profile.data.characterIds[0];
  const seasonResetCount = destinyData.characterProgressions.data[charId].progressions[gambitId].currentResetCount;

  const resetObjective = {
    hint: 'Resets',
    isComplete: seasonResetCount >= 1,
    curValue: seasonResetCount,
    reqValue: 1
  };

  const pinacleWeaponIds = [
    1666039008, // Breakneck
    1639266456, // Delirium
    1670904512, // Hush
  ];

  let pinacleWeaponAquired = 0;
  pinacleWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      pinacleWeaponAquired++;
  });

  const collectionObjective = {
    hint: '',
    isComplete: pinacleWeaponAquired >= 3,
    curValue: pinacleWeaponAquired,
    reqValue: 3,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/6476417e115081cbb54d6c9fb7741fff.jpg',
        isAquired: isCollectibleAquired(destinyData, 1666039008)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/11eeb53a1b5915c5e1740c0dda9b5f05.jpg',
        isAquired: isCollectibleAquired(destinyData, 1639266456)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/dfac5b867e558fc6b4acc167a97556eb.jpg',
        isAquired: isCollectibleAquired(destinyData, 1670904512)
      },
    ]
  };

  const exoticWeaponIds = [
    1660030045, // Malfeasance
  ];

  let exoticWeaponAquired = 0;
  exoticWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      exoticWeaponAquired++;
  });

  const exoticObjective = {
    hint: '',
    isComplete: exoticWeaponAquired >= 1,
    curValue: exoticWeaponAquired,
    reqValue: 1,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/86ef7fd7c087c434a16089602e2c00de.jpg',
        isAquired: isCollectibleAquired(destinyData, 1660030045)
      },
    ]
  };

  const triumphs = [
    {
      name: 'Infamy Rank',
      description: 'Reset your Infamy Rank in the active season',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/fc31e8ede7cc15908d6e2dfac25d78ff.png',
      isComplete: resetObjective.isComplete,
      objectives: [
        resetObjective
      ]
    },
    {
      name: 'Pinacle Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/2565ae54801563abfefd78f8c2dd6463.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        collectionObjective
      ]
    },
    {
      name: 'Exotic Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/f0a13943dfd6f1bffd8f88e82381db8a.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        exoticObjective
      ]
    },
  ];

  return {
    name: 'Outlaw',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

exports.parseVanquisher = function (destinyData) {
  const nfId = 689153319;
  const charId = destinyData.profile.data.characterIds[0];
  const nfRank = destinyData.characterProgressions.data[charId].progressions[nfId].level;

  const rankObjective = {
    hint: 'Rank',
    isComplete: nfRank >= 20,
    curValue: nfRank,
    reqValue: 20
  };

  const pinacleWeaponIds = [
    3810740723, // Loaded Question
    543982652,  // Oxygen SR3
    3830703103, // Wendigo
  ];

  let pinacleWeaponAquired = 0;
  pinacleWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      pinacleWeaponAquired++;
  });

  const collectionObjective = {
    hint: '',
    isComplete: pinacleWeaponAquired >= 3,
    curValue: pinacleWeaponAquired,
    reqValue: 3,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/a233aa2e2cba2f8a15f998dee8f8a5bd.jpg',
        isAquired: isCollectibleAquired(destinyData, 3810740723)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/2effa057233e8d622a477d9d7e9b03f2.jpg',
        isAquired: isCollectibleAquired(destinyData, 543982652)
      },
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/1242a9eff118e8cfc3cd6ebc3995f626.jpg',
        isAquired: isCollectibleAquired(destinyData, 3830703103)
      },
    ]
  };

  const triumphs = [
    {
      name: 'Nightfalls',
      description: 'Achieve a high Nightfall rank',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/1538509805dda202c0d14771fe4f6d20.png',
      isComplete: rankObjective.isComplete,
      objectives: [
        rankObjective
      ]
    },
    {
      name: 'Pinacle Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/2565ae54801563abfefd78f8c2dd6463.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        collectionObjective
      ]
    },
  ];

  return {
    name: 'Vanquisher',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}
