export type PersonQueryType = {
  isPv3Employee?: boolean;
  enrolled?: boolean;
  template?: string;
};

export type ResourceLastStatusType = {
  type?: string;
  updating?: boolean;
  _id?: string;
  lastServerTimestamp?: number;
};
