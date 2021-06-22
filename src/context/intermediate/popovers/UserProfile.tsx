import { decodeTime } from "ulid";
import { Localizer, Text } from "preact-i18n";
import styles from "./UserProfile.module.scss";
import Modal from "../../../components/ui/Modal";
import { Route } from "revolt.js/dist/api/routes";
import { Users } from "revolt.js/dist/api/objects";
import { useIntermediate } from "../Intermediate";
import { Link, useHistory } from "react-router-dom";
import { CashStack } from "@styled-icons/bootstrap";
import Preloader from "../../../components/ui/Preloader";
import Tooltip from '../../../components/common/Tooltip';
import Markdown from '../../../components/markdown/Markdown';
import UserIcon from '../../../components/common/user/UserIcon';
import ChannelIcon from '../../../components/common/ChannelIcon';
import UserStatus from '../../../components/common/user/UserStatus';
import { Mail, Edit, UserPlus, Shield } from "@styled-icons/feather";
import { useChannels, useForceUpdate, useUsers } from "../../revoltjs/hooks";
import { useContext, useEffect, useLayoutEffect, useState } from "preact/hooks";
import { AppContext, ClientStatus, StatusContext } from "../../revoltjs/RevoltClient";

interface Props {
    user_id: string;
    dummy?: boolean;
    onClose: () => void;
    dummyProfile?: Users.Profile;
}

enum Badges {
    Developer = 1,
    Translator = 2,
    Supporter = 4,
    ResponsibleDisclosure = 8,
    EarlyAdopter = 256
}

export function UserProfile({ user_id, onClose, dummy, dummyProfile }: Props) {
    const { writeClipboard } = useIntermediate();

    const [profile, setProfile] = useState<undefined | null | Users.Profile>(
        undefined
    );
    const [mutual, setMutual] = useState<
        undefined | null | Route<"GET", "/users/id/mutual">["response"]
    >(undefined);

    const client = useContext(AppContext);
    const status = useContext(StatusContext);
    const [tab, setTab] = useState("profile");
    const history = useHistory();

    const ctx = useForceUpdate();
    const all_users = useUsers(undefined, ctx);
    const channels = useChannels(undefined, ctx);

    const user = all_users.find(x => x!._id === user_id);
    const users = mutual?.users ? all_users.filter(x => mutual.users.includes(x!._id)) : undefined;

    if (!user) {
        useEffect(onClose, []);
        return null;
    }

    useLayoutEffect(() => {
        if (!user_id) return;
        if (typeof profile !== 'undefined') setProfile(undefined);
        if (typeof mutual  !== 'undefined') setMutual(undefined);
    }, [user_id]);

    if (dummy) {
        useLayoutEffect(() => {
            setProfile(dummyProfile);
        }, [dummyProfile]);
    }

    useEffect(() => {
        if (dummy) return;
        if (
            status === ClientStatus.ONLINE &&
            typeof mutual === "undefined"
        ) {
            setMutual(null);
            client.users
                .fetchMutual(user_id)
                .then(data => setMutual(data));
        }
    }, [mutual, status]);

    useEffect(() => {
        if (dummy) return;
        if (
            status === ClientStatus.ONLINE &&
            typeof profile === "undefined"
        ) {
            setProfile(null);

            // ! FIXME: in the future, also check if mutual guilds
            // ! maybe just allow mutual group to allow profile viewing
            /*if (
                user.relationship === Users.Relationship.Friend ||
                user.relationship === Users.Relationship.User
            ) {*/
                client.users
                    .fetchProfile(user_id)
                    .then(data => setProfile(data))
                    .catch(() => {});
            //}
        }
    }, [profile, status]);

    const mutualGroups = channels.filter(
        channel =>
            channel?.channel_type === "Group" &&
            channel.recipients.includes(user_id)
    );

    const backgroundURL = profile && client.users.getBackgroundURL(profile, { width: 1000 }, true);
    const badges = (user.badges ?? 0) | (decodeTime(user._id) < 1623751765790 ? Badges.EarlyAdopter : 0);

    return (
        <Modal
            visible
            border={dummy}
            onClose={onClose}
            dontModal={dummy}
        >
            <div
                className={styles.header}
                data-force={
                    profile?.background
                        ? "light"
                        : undefined
                }
                style={{
                    backgroundImage: backgroundURL && `linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7) ), url('${backgroundURL}')`
                }}
            >
                <div className={styles.profile}>
                    <UserIcon size={80} target={user} status />
                    <div className={styles.details}>
                        <Localizer>
                            <span
                                className={styles.username}
                                onClick={() => writeClipboard(user.username)}>
                                @{user.username}
                            </span>
                        </Localizer>
                        {user.status?.text && (
                            <span className={styles.status}>
                                <UserStatus user={user} />
                            </span>
                        )}
                    </div>
                    {user.relationship === Users.Relationship.Friend && (
                        <Localizer>
                            <Tooltip
                                content={
                                    <Text id="app.context_menu.message_user" />
                                }
                            >
                                {/*<IconButton
                                    onClick={() => {
                                        onClose();
                                        history.push(`/open/${user_id}`);
                                    }}
                                >*/}
                                    <Mail size={30} strokeWidth={1.5} />
                                {/*</IconButton>*/}
                            </Tooltip>
                        </Localizer>
                    )}
                    {user.relationship === Users.Relationship.User && (
                        /*<IconButton
                            onClick={() => {
                                onClose();
                                if (dummy) return;
                                history.push(`/settings/profile`);
                            }}
                        >*/
                            <Edit size={28} strokeWidth={1.5} />
                        /*</IconButton>*/
                    )}
                    {(user.relationship === Users.Relationship.Incoming ||
                        user.relationship === Users.Relationship.None) && (
                        /*<IconButton
                            onClick={() => client.users.addFriend(user.username)}
                        >*/
                            <UserPlus size={28} strokeWidth={1.5} />
                        /*</IconButton>*/
                    )}
                </div>
                <div className={styles.tabs}>
                    <div
                        data-active={tab === "profile"}
                        onClick={() => setTab("profile")}
                    >
                        <Text id="app.special.popovers.user_profile.profile" />
                    </div>
                    { user.relationship !== Users.Relationship.User &&
                        <>
                            <div
                                data-active={tab === "friends"}
                                onClick={() => setTab("friends")}
                            >
                                <Text id="app.special.popovers.user_profile.mutual_friends" />
                            </div>
                            <div
                                data-active={tab === "groups"}
                                onClick={() => setTab("groups")}
                            >
                                <Text id="app.special.popovers.user_profile.mutual_groups" />
                            </div>
                        </>
                    }
                </div>
            </div>
            <div className={styles.content}>
                {tab === "profile" &&
                <div>
                    { !(profile?.content || (badges > 0)) &&
                        <div className={styles.empty}><Text id="app.special.popovers.user_profile.empty" /></div> }
                    { (badges > 0) && <div className={styles.category}><Text id="app.special.popovers.user_profile.sub.badges" /></div> }
                    { (badges > 0) && (
                        <div className={styles.badges}>
                            <Localizer>
                                {badges & Badges.Developer ? (
                                    <Tooltip
                                        content={
                                            <Text id="app.navigation.tabs.dev" />
                                        }
                                    >
                                        <img src="/assets/badges/developer.svg" />
                                    </Tooltip>
                                ) : (
                                    <></>
                                )}
                                {badges & Badges.Translator ? (
                                    <Tooltip
                                        content={
                                            <Text id="app.special.popovers.user_profile.badges.translator" />
                                        }
                                    >
                                        <img src="/assets/badges/translator.svg" />
                                    </Tooltip>
                                ) : (
                                    <></>
                                )}
                                {badges & Badges.EarlyAdopter ? (
                                    <Tooltip
                                        content={
                                            <Text id="app.special.popovers.user_profile.badges.early_adopter" />
                                        }
                                    >
                                        <img src="/assets/badges/early_adopter.svg" />
                                    </Tooltip>
                                ) : (
                                    <></>
                                )}
                                {badges & Badges.Supporter ? (
                                    <Tooltip
                                        content={
                                            <Text id="app.special.popovers.user_profile.badges.supporter" />
                                        }
                                    >
                                        <CashStack size={32} color="#efab44" />
                                    </Tooltip>
                                ) : (
                                    <></>
                                )}
                                {badges & Badges.ResponsibleDisclosure ? (
                                    <Tooltip
                                        content={
                                            <Text id="app.special.popovers.user_profile.badges.responsible_disclosure" />
                                        }
                                    >
                                        <Shield size={32} color="gray" />
                                    </Tooltip>
                                ) : (
                                    <></>
                                )}
                            </Localizer>
                        </div>
                    )}
                    { profile?.content && <div className={styles.category}><Text id="app.special.popovers.user_profile.sub.information" /></div> }
                    <Markdown content={profile?.content} />
                    {/*<div className={styles.category}><Text id="app.special.popovers.user_profile.sub.connections" /></div>*/}
                </div>}
                {tab === "friends" &&
                    (users ? (
                        <div className={styles.entries}>
                            {users.length === 0 ? (
                                <div className={styles.empty}>
                                    <Text id="app.special.popovers.user_profile.no_users" />
                                </div>
                            ) : (
                                users.map(
                                    x =>
                                        x && (
                                            //<LinkProfile user_id={x._id}>
                                                <div
                                                    className={styles.entry}
                                                    key={x._id}
                                                >
                                                    <UserIcon size={32} target={x} />
                                                    <span>{x.username}</span>
                                                </div>
                                            //</LinkProfile>
                                        )
                                )
                            )}
                        </div>
                    ) : (
                        <Preloader type="ring" />
                    ))}
                {tab === "groups" && (
                    <div className={styles.entries}>
                        {mutualGroups.length === 0 ? (
                            <div className={styles.empty}>
                                <Text id="app.special.popovers.user_profile.no_groups" />
                            </div>
                        ) : (
                            mutualGroups.map(
                                x =>
                                    x?.channel_type === "Group" && (
                                        <Link to={`/channel/${x._id}`}>
                                            <div
                                                className={styles.entry}
                                                key={x._id}
                                            >
                                                <ChannelIcon target={x} size={32} />
                                                <span>{x.name}</span>
                                            </div>
                                        </Link>
                                    )
                            )
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}