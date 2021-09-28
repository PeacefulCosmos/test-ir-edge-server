enum PersonRoleType {
  TYPE_NORMAL = 'NORMAL',
  TYPE_VIP = 'VIP',
  TYPE_BLACKLIST = 'BLACKLIST',
}

export interface BroadcastMessage {
  MAC: string;
  SOURCE_PKG_NAME: string;
  DESTINATION_PKG_NAME: string;
  TRANSACTION_ID: string;
  TIMESTAMP: string;
  ACTION: string;
  DATA: {
    _id?: string;
    name?: string;
    type?: PersonRoleType;
    template?: string;
    image?: string;
    error?: any;
  };
}

//enrollFace() doc type
export type enrollFaceDocType = {
  id: string;
  name: string;
  type: PersonRoleType;
  faceData: string;
};
