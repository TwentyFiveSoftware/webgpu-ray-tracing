import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";

const resolutionOptions: number[] = [2160, 1440, 1080, 720, 360]; // height
const sampleCountOptions: number[] = [1, 10, 100, 1000];

type Props = {
	render: (width: number, height: number, samples: number) => void;
};

export const Settings: React.FC<Props> = ({ render }) => {
	const [selectedResolution, setSelectedResolution] = useState<number>(1080);
	const [selectedSampleCount, setSelectedSampleCount] = useState<number>(100);

	return (
		<Card className="w-[450px] max-w-[95vw]">
			<CardHeader className="text-center">
				<CardTitle className="text-xl">Settings</CardTitle>
				<CardDescription>Configure the Ray Tracer.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={(e) => e.preventDefault()}>
					<FieldSet>
						<FieldGroup>
							<FieldSet>
								<FieldLegend>Image Resolution</FieldLegend>
								<FieldDescription>
									Select the resolution of the rendered image. Larger
									resolutions lead to drastically longer render times.
								</FieldDescription>
								<RadioGroup
									defaultValue={selectedResolution.toString()}
									onValueChange={(value) =>
										setSelectedResolution(Number(value))
									}
								>
									{resolutionOptions.map((resolutionHeight) => (
										<FieldLabel
											htmlFor={`resolution-${resolutionHeight}`}
											key={resolutionHeight}
											className="cursor-pointer"
										>
											<Field orientation="horizontal">
												<FieldContent>
													<FieldTitle>{`${(resolutionHeight * 16) / 9}x${resolutionHeight}`}</FieldTitle>
												</FieldContent>
												<RadioGroupItem
													value={resolutionHeight.toString()}
													id={`resolution-${resolutionHeight}`}
												/>
											</Field>
										</FieldLabel>
									))}
								</RadioGroup>
							</FieldSet>

							<FieldSeparator />

							<FieldSet>
								<FieldLegend>Samples per Pixel</FieldLegend>
								<FieldDescription>
									Select the number of samples that are traced per pixel. More
									samples lead to less noise but longer render times.
								</FieldDescription>
								<RadioGroup
									defaultValue={selectedSampleCount.toString()}
									onValueChange={(value) =>
										setSelectedSampleCount(Number(value))
									}
								>
									{sampleCountOptions.map((samples) => (
										<FieldLabel
											htmlFor={`samples-${samples}`}
											key={samples}
											className="cursor-pointer"
										>
											<Field orientation="horizontal">
												<FieldContent>
													<FieldTitle>{samples}</FieldTitle>
												</FieldContent>
												<RadioGroupItem
													value={samples.toString()}
													id={`samples-${samples}`}
												/>
											</Field>
										</FieldLabel>
									))}
								</RadioGroup>
							</FieldSet>

							<Button
								variant="default"
								type="button"
								onClick={() =>
									render(
										(selectedResolution * 16) / 9,
										selectedResolution,
										selectedSampleCount,
									)
								}
							>
								Render
							</Button>
						</FieldGroup>
					</FieldSet>
				</form>
			</CardContent>
		</Card>
	);
};
