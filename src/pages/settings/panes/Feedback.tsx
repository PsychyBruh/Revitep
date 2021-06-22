import { useState } from "preact/hooks";
import styles from "./Panes.module.scss";
import { Localizer, Text } from "preact-i18n";
import Radio from "../../../components/ui/Radio";
import Button from "../../../components/ui/Button";
import InputBox from "../../../components/ui/InputBox";
import TextArea from "../../../components/ui/TextArea";
import { useSelf } from "../../../context/revoltjs/hooks";

export function Feedback() {
    const user = useSelf();
    const [other, setOther] = useState("");
    const [description, setDescription] = useState("");
    const [state, setState] = useState<"ready" | "sending" | "sent">("ready");
    const [checked, setChecked] = useState<
        "Bug" | "Feature Request" | "__other_option__"
    >("Bug");

    async function onSubmit(ev: JSX.TargetedEvent<HTMLFormElement, Event>) {
        ev.preventDefault();
        setState("sending");

        await fetch(
            `https://workers.revolt.chat/feedback`,
            {
                method: "POST",
                body: JSON.stringify({
                    checked,
                    other,
                    description,
                    name: user?.username ?? "Unknown User"
                }),
                mode: 'no-cors'
            }
        );

        setState("sent");
        setChecked("Bug");
        setDescription("");
        setOther("");
    }

    return (
        <form className={styles.feedback} onSubmit={onSubmit}>
            <h3>
                <Text id="app.settings.pages.feedback.report" />
            </h3>
            <div className={styles.options}>
                <Radio
                    checked={checked === "Bug"}
                    disabled={state === "sending"}
                    onSelect={() => setChecked("Bug")}>
                    <Text id="app.settings.pages.feedback.bug" />
                </Radio>
                <Radio
                    disabled={state === "sending"}
                    checked={checked === "Feature Request"}
                    onSelect={() => setChecked("Feature Request")}>
                    <Text id="app.settings.pages.feedback.feature" />
                </Radio>
                { (location.hostname === 'vite.revolt.chat' || location.hostname === 'local.revolt.chat') && <Radio
                    disabled={state === "sending"}
                    checked={other === "Revite"}
                    onSelect={() => {
                        setChecked("__other_option__");
                        setOther("Revite");
                    }}>
                    Issues with Revite
                </Radio> }
                <Radio
                    disabled={state === "sending"}
                    checked={checked === "__other_option__"}
                    onSelect={() => setChecked("__other_option__")}>
                    <Localizer>
                        <InputBox
                            value={other}
                            disabled={state === "sending"}
                            name="entry.1151440373.other_option_response"
                            onChange={e => setOther(e.currentTarget.value)}
                            placeholder={
                                (
                                    <Text id="app.settings.pages.feedback.other" />
                                ) as any
                            }
                        />
                    </Localizer>
                </Radio>
            </div>
            <h3>
                <Text id="app.settings.pages.feedback.describe" />
            </h3>
            <TextArea
                // maxRows={10}
                value={description}
                id="entry.685672624"
                disabled={state === "sending"}
                onChange={ev => setDescription(ev.currentTarget.value)}
            />
            <Button type="submit" contrast>
                <Text id="app.settings.pages.feedback.send" />
            </Button>
        </form>
    );
}