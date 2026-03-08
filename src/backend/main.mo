import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Principal "mo:core/Principal";



actor {
  include MixinStorage();

  var persistentAdmin : ?Principal = null;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Theme = {
    #garden;
    #ocean;
    #candyland;
    #forest;
    #volcano;
    #space;
  };

  public type SoundContext = {
    #backgroundMusic;
    #tileClick;
    #tileMatch;
    #tileClear;
    #layerOpen;
    #bomb;
    #clock;
    #magnifier;
    #shuffle;
    #levelComplete;
    #starEarned;
    #worldUnlock;
    #buttonClick;
    #rewardClaim;
    #bossLevelStart;
    #bossVictory;
    #bossDefeat;
    #bossObjective;
  };

  public type AudioFile = {
    id : Text;
    context : SoundContext;
    world : ?Theme;
    blob : Storage.ExternalBlob;
    description : Text;
  };

  let audioFiles = Map.empty<Text, AudioFile>();

  func requirePersistentAdmin(caller : Principal) : () {
    switch (persistentAdmin) {
      case (?adminPrincipal) {
        if (not (Principal.equal(adminPrincipal, caller))) {
          Runtime.trap("Unauthorized: Only admins can perform this action");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: No admin set");
      };
    };
  };

  public shared ({ caller }) func addAudioFile(
    id : Text,
    context : SoundContext,
    world : ?Theme,
    blob : Storage.ExternalBlob,
    description : Text,
  ) : async () {
    requirePersistentAdmin(caller);

    let newAudioFile = {
      id;
      context;
      world;
      blob;
      description;
    };

    audioFiles.add(id, newAudioFile);
  };

  public shared ({ caller }) func deleteAudioFile(
    id : Text,
  ) : async () {
    requirePersistentAdmin(caller);

    switch (audioFiles.get(id)) {
      case (null) { Runtime.trap("Ses dosyası bulunamadı") };
      case (?_) {
        audioFiles.remove(id);
      };
    };
  };

  public query func getAudioFile(id : Text) : async AudioFile {
    switch (audioFiles.get(id)) {
      case (null) { Runtime.trap("Ses dosyası bulunamadı") };
      case (?audioFile) { audioFile };
    };
  };

  public query func getAudioFilesByContext(
    context : SoundContext,
  ) : async [AudioFile] {
    let iter = audioFiles.values();
    let filteredIter = iter.filter(func(file) { file.context == context });
    filteredIter.toArray();
  };

  public query func getAudioFilesByWorld(
    world : Theme,
  ) : async [AudioFile] {
    let iter = audioFiles.values();
    let filteredIter = iter.filter(
      func(file) {
        switch (file.world) {
          case (null) { false };
          case (?w) { w == world };
        };
      }
    );
    filteredIter.toArray();
  };

  public query func getAllAudioFiles() : async [AudioFile] {
    audioFiles.values().toArray();
  };

  public shared ({ caller }) func adminLogin(password : Text) : async () {
    if (password != "adminking+154") {
      Runtime.trap("Yetkisiz: Yanlış yönetici şifresi");
    };
    persistentAdmin := ?caller;
    AccessControl.assignRole(accessControlState, caller, caller, #admin);
  };
};
